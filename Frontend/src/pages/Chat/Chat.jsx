import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";
import "./Chat.css";

function Chat() {
    const { userId } = useParams();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);

    const [user, setUser] = useState(null);
    const [online, setOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [menuMessageId, setMenuMessageId] = useState(null);

    const currentUserId = localStorage.getItem("userId");

    // =====================================================
    // CALL STATES
    // =====================================================

    const [callIncoming, setCallIncoming] = useState(false);
    const [callType, setCallType] = useState(null);
    const [callerId, setCallerId] = useState(null);
    const [callActive, setCallActive] = useState(false);
    const [callStatus, setCallStatus] = useState("");

    // =====================================================
    // WEBRTC REFS
    // =====================================================

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnection = useRef(null);
    const localStream = useRef(null);

    // ICE candidates jo remote description se pehle aaye
    const pendingIceCandidates = useRef([]);

    // =====================================================
    // RINGTONE REFS
    // =====================================================

    const audioContextRef = useRef(null);
    const ringtoneTimerRef = useRef(null);

    // =====================================================
    // FETCH USER
    // =====================================================

    const fetchUser = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/Post/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setUser(response.data.user);
        } catch (err) {
            console.log(
                "FETCH USER ERROR:",
                err.response?.data || err.message
            );
        }
    };

    // =====================================================
    // FETCH MESSAGES
    // =====================================================

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/message/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setMessages(response.data.messages || []);
        } catch (err) {
            console.log(
                "FETCH MESSAGES ERROR:",
                err.response?.data || err.message
            );
        }
    };

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = async () => {
        if (!text.trim() && !selectedFile) {
            return;
        }

        try {
            const formData = new FormData();

            formData.append("message", text);

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const response = await axios.post(
                `https://orbit-backend-94nx.onrender.com/api/message/send/${userId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const sentMsg = response.data.newMessage;

            socket.emit("send_message", {
                ...sentMsg,
                receiver: userId
            });

            setMessages((prev) => [
                ...prev,
                sentMsg
            ]);

            setText("");
            setSelectedFile(null);
            setPreview("");

            clearTimeout(typingTimeout.current);

            socket.emit("stop_typing", {
                sender: currentUserId,
                receiver: userId
            });
        } catch (err) {
            console.log(
                err.response?.data || err.message
            );
        }
    };

    // =====================================================
    // LAST SEEN
    // =====================================================

    const formatLastSeen = (date) => {
        if (!date) {
            return "";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    // =====================================================
    // START RINGTONE
    // =====================================================

    const playRingtone = () => {
        try {
            stopRingtone();

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContext) {
                return;
            }

            const audioContext =
                new AudioContext();

            audioContextRef.current =
                audioContext;

            const playBeep = () => {
                if (!audioContextRef.current) {
                    return;
                }

                const oscillator =
                    audioContext.createOscillator();

                const gain =
                    audioContext.createGain();

                oscillator.type = "sine";

                oscillator.frequency.setValueAtTime(
                    700,
                    audioContext.currentTime
                );

                oscillator.frequency.setValueAtTime(
                    900,
                    audioContext.currentTime + 0.25
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    audioContext.currentTime
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.25,
                    audioContext.currentTime + 0.03
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    audioContext.currentTime + 0.5
                );

                oscillator.connect(gain);
                gain.connect(
                    audioContext.destination
                );

                oscillator.start();

                oscillator.stop(
                    audioContext.currentTime + 0.5
                );
            };

            if (
                audioContext.state ===
                "suspended"
            ) {
                audioContext.resume();
            }

            playBeep();

            ringtoneTimerRef.current =
                setInterval(() => {
                    playBeep();
                }, 1200);
        } catch (error) {
            console.log(
                "RINGTONE ERROR:",
                error
            );
        }
    };

    // =====================================================
    // STOP RINGTONE
    // =====================================================

    const stopRingtone = () => {
        if (ringtoneTimerRef.current) {
            clearInterval(
                ringtoneTimerRef.current
            );

            ringtoneTimerRef.current =
                null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (error) {
                console.log(
                    "AUDIO CONTEXT CLOSE ERROR:",
                    error
                );
            }

            audioContextRef.current =
                null;
        }
    };

    // =====================================================
    // CREATE WEBRTC PEER CONNECTION
    // =====================================================

    const createPeerConnection = (
        otherUserId
    ) => {
        console.log(
            "🔗 Creating PeerConnection:",
            otherUserId
        );

        const pc =
            new RTCPeerConnection({
                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302"
                    },
                    {
                        urls:
                            "stun:stun1.l.google.com:19302"
                    }
                ]
            });

        peerConnection.current = pc;

        // =================================================
        // ADD LOCAL TRACKS
        // =================================================

        if (localStream.current) {
            localStream.current
                .getTracks()
                .forEach((track) => {
                    pc.addTrack(
                        track,
                        localStream.current
                    );
                });
        }

        // =================================================
        // REMOTE STREAM
        // =================================================

        pc.ontrack = (event) => {
            console.log(
                "🎥 REMOTE STREAM RECEIVED"
            );

            const remoteStream =
                event.streams?.[0];

            if (
                remoteStream &&
                remoteVideoRef.current
            ) {
                remoteVideoRef.current.srcObject =
                    remoteStream;

                remoteVideoRef.current
                    .play()
                    .catch((error) => {
                        console.log(
                            "REMOTE PLAY ERROR:",
                            error
                        );
                    });
            }
        };

        // =================================================
        // ICE CANDIDATE
        // =================================================

        pc.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            console.log(
                "🧊 Sending ICE Candidate"
            );

            socket.emit(
                "call:ice-candidate",
                {
                    receiverId:
                        otherUserId,

                    candidate:
                        event.candidate
                }
            );
        };

        // =================================================
        // CONNECTION STATE
        // =================================================

        pc.onconnectionstatechange = () => {
            console.log(
                "📡 WEBRTC STATE:",
                pc.connectionState
            );

            if (
                pc.connectionState ===
                "connecting"
            ) {
                setCallStatus(
                    "Connecting..."
                );
            }

            if (
                pc.connectionState ===
                "connected"
            ) {
                setCallStatus(
                    "Connected"
                );
            }

            if (
                pc.connectionState ===
                "disconnected"
            ) {
                setCallStatus(
                    "Connection lost"
                );
            }

            if (
                pc.connectionState ===
                "failed"
            ) {
                setCallStatus(
                    "Connection failed"
                );
            }
        };

        return pc;
    };

    // =====================================================
    // START WEBRTC OFFER
    // =====================================================

    const startWebRTCOffer = async (
        receiverId
    ) => {
        try {
            console.log(
                "📤 Creating WebRTC Offer"
            );

            if (!localStream.current) {
                console.log(
                    "❌ Local stream missing"
                );

                return;
            }

            const pc =
                createPeerConnection(
                    receiverId
                );

            const offer =
                await pc.createOffer();

            await pc.setLocalDescription(
                offer
            );

            socket.emit(
                "call:offer",
                {
                    receiverId,
                    offer
                }
            );

            setCallStatus(
                "Calling..."
            );

            console.log(
                "📤 WebRTC OFFER SENT"
            );
        } catch (error) {
            console.log(
                "WEBRTC OFFER ERROR:",
                error
            );
        }
    };

    // =====================================================
    // START CALL
    // =====================================================

    const startCall = async (type) => {
        if (
            !currentUserId ||
            !userId
        ) {
            return;
        }

        if (
            callActive ||
            callIncoming
        ) {
            return;
        }

        try {
            console.log(
                "📞 STARTING CALL:",
                type
            );

            setCallType(type);
            setCallStatus(
                "Calling..."
            );

            // =================================================
            // CAMERA + MICROPHONE
            // =================================================

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                        video:
                            type ===
                            "video"
                    }
                );

            localStream.current =
                stream;

            // =================================================
            // LOCAL VIDEO
            // =================================================

            if (
                localVideoRef.current
            ) {
                localVideoRef.current.srcObject =
                    stream;
            }

            // Caller ko call screen dikhao
            setCallActive(true);

            // =================================================
            // JOIN CALL SOCKET
            // =================================================

            socket.emit(
                "call:join",
                currentUserId
            );

            // =================================================
            // SEND CALL REQUEST
            // =================================================

            socket.emit(
                "call:start",
                {
                    callerId:
                        currentUserId,

                    receiverId:
                        userId,

                    callType:
                        type
                }
            );

            console.log(
                "📞 CALL REQUEST SENT"
            );
        } catch (error) {
            console.log(
                "CALL MEDIA ERROR:",
                error
            );

            setCallActive(false);
            setCallType(null);
            setCallStatus("");

            alert(
                "Camera/Microphone permission required."
            );
        }
    };

    // =====================================================
    // ACCEPT CALL
    // =====================================================

    const acceptCall = async () => {
        try {
            console.log(
                "✅ ACCEPTING CALL"
            );

            stopRingtone();

            // =================================================
            // CAMERA + MICROPHONE
            // =================================================

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                        video:
                            callType ===
                            "video"
                    }
                );

            localStream.current =
                stream;

            // =================================================
            // LOCAL VIDEO
            // =================================================

            if (
                localVideoRef.current
            ) {
                localVideoRef.current.srcObject =
                    stream;
            }

            // =================================================
            // SEND ACCEPT
            // =================================================

            socket.emit(
                "call:accept",
                {
                    callerId,

                    receiverId:
                        currentUserId
                }
            );

            setCallIncoming(false);
            setCallActive(true);
            setCallStatus(
                "Connecting..."
            );

            console.log(
                "✅ CALL ACCEPTED"
            );
        } catch (error) {
            console.log(
                "ACCEPT CALL ERROR:",
                error
            );

            stopRingtone();

            alert(
                "Camera/Microphone permission required."
            );
        }
    };

    // =====================================================
    // REJECT CALL
    // =====================================================

    const rejectCall = () => {
        console.log(
            "❌ REJECTING CALL"
        );

        stopRingtone();

        socket.emit(
            "call:reject",
            {
                callerId,

                receiverId:
                    currentUserId
            }
        );

        setCallIncoming(false);
        setCallerId(null);
        setCallType(null);
        setCallStatus("");
    };

    // =====================================================
    // END CALL
    // =====================================================

    const endCall = (
        sendSocket = true
    ) => {
        console.log(
            "📴 ENDING CALL"
        );

        stopRingtone();

        // =================================================
        // INFORM OTHER USER
        // =================================================

        if (sendSocket) {
            socket.emit(
                "call:end",
                {
                    callerId:
                        currentUserId,

                    receiverId:
                        userId
                }
            );
        }

        // =================================================
        // STOP LOCAL STREAM
        // =================================================

        if (
            localStream.current
        ) {
            localStream.current
                .getTracks()
                .forEach(
                    (track) => {
                        track.stop();
                    }
                );

            localStream.current =
                null;
        }

        // =================================================
        // CLOSE PEER CONNECTION
        // =================================================

        if (
            peerConnection.current
        ) {
            peerConnection.current.close();

            peerConnection.current =
                null;
        }

        pendingIceCandidates.current =
            [];

        // =================================================
        // CLEAR VIDEO
        // =================================================

        if (
            localVideoRef.current
        ) {
            localVideoRef.current.srcObject =
                null;
        }

        if (
            remoteVideoRef.current
        ) {
            remoteVideoRef.current.srcObject =
                null;
        }

        // =================================================
        // RESET STATE
        // =================================================

        setCallActive(false);
        setCallIncoming(false);
        setCallerId(null);
        setCallType(null);
        setCallStatus("");
    };

    // =====================================================
    // MAIN SOCKET EFFECT
    // =====================================================

    useEffect(() => {
        if (!currentUserId) {
            return;
        }

        // =================================================
        // JOIN CHAT SOCKET
        // =================================================

        socket.emit(
            "join",
            currentUserId
        );

        // =================================================
        // JOIN CALL SOCKET
        // =================================================

        socket.emit(
            "call:join",
            currentUserId
        );

        // =================================================
        // INITIAL DATA
        // =================================================

        fetchUser();
        fetchMessages();

        // =================================================
        // MARK MESSAGES SEEN
        // =================================================

        axios.put(
            `https://orbit-backend-94nx.onrender.com/api/message/seen/${userId}`,
            {},
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).catch((err) => {
            console.log(
                "SEEN ERROR:",
                err.response?.data ||
                    err.message
            );
        });

        // =================================================
        // RECEIVE MESSAGE
        // =================================================

        const handleReceiveMessage =
            async (newMessage) => {
                if (
                    String(
                        newMessage.sender
                    ) === String(userId)
                ) {
                    setMessages(
                        (prev) => [
                            ...prev,
                            newMessage
                        ]
                    );

                    socket.emit(
                        "message_delivered",
                        {
                            messageId:
                                newMessage._id,

                            senderId:
                                newMessage.sender
                        }
                    );

                    try {
                        await axios.put(
                            `https://orbit-backend-94nx.onrender.com/api/message/seen/${newMessage.sender}`,
                            {},
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${localStorage.getItem("token")}`
                                }
                            }
                        );

                        socket.emit(
                            "message_seen",
                            {
                                messageId:
                                    newMessage._id,

                                senderId:
                                    newMessage.sender
                            }
                        );
                    } catch (err) {
                        console.log(
                            "MESSAGE SEEN ERROR:",
                            err.response
                                ?.data ||
                                err.message
                        );
                    }
                }
            };

        // =================================================
        // MESSAGE DELIVERED
        // =================================================

        const handleMessageDelivered =
            ({ messageId }) => {
                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) =>
                                msg._id ===
                                messageId
                                    ? {
                                          ...msg,
                                          status:
                                              "delivered"
                                      }
                                    : msg
                        )
                );
            };

        // =================================================
        // MESSAGE SEEN
        // =================================================

        const handleMessageSeen =
            ({ messageId }) => {
                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) =>
                                msg._id ===
                                messageId
                                    ? {
                                          ...msg,
                                          status:
                                              "seen"
                                      }
                                    : msg
                        )
                );
            };

        // =================================================
        // ONLINE USERS
        // =================================================

        const handleOnlineUsers =
            (users) => {
                setOnline(
                    users.includes(userId)
                );
            };

        // =================================================
        // TYPING
        // =================================================

        const handleTyping =
            (senderId) => {
                if (
                    String(
                        senderId
                    ) === String(userId)
                ) {
                    setIsTyping(true);
                }
            };

        // =================================================
        // STOP TYPING
        // =================================================

        const handleStopTyping =
            (senderId) => {
                if (
                    String(
                        senderId
                    ) === String(userId)
                ) {
                    setIsTyping(false);
                }
            };

        // =================================================
        // INCOMING CALL
        // =================================================

        const handleIncomingCall =
            (data) => {
                console.log(
                    "📞 INCOMING CALL:",
                    data
                );

                // Already kisi call me hai
                if (callActive) {
                    return;
                }

                setCallerId(
                    data.callerId
                );

                setCallType(
                    data.callType
                );

                setCallIncoming(
                    true
                );

                setCallStatus(
                    "Incoming call..."
                );

                // 🔔 RINGTONE
                playRingtone();
            };

        // =================================================
        // CALL ACCEPTED
        // =================================================

        const handleCallAccepted =
            async (data) => {
                console.log(
                    "✅ CALL ACCEPTED:",
                    data
                );

                stopRingtone();

                setCallIncoming(
                    false
                );

                setCallActive(
                    true
                );

                setCallStatus(
                    "Connecting..."
                );

                // Caller ab WebRTC OFFER banayega
                await startWebRTCOffer(
                    data.receiverId
                );
            };

        // =================================================
        // CALL REJECTED
        // =================================================

        const handleCallRejected =
            () => {
                console.log(
                    "❌ CALL REJECTED"
                );

                stopRingtone();

                endCall(false);

                alert(
                    "Call rejected"
                );
            };

        // =================================================
        // USER OFFLINE
        // =================================================

        const handleUserOffline =
            () => {
                console.log(
                    "📴 USER OFFLINE"
                );

                stopRingtone();

                endCall(false);

                alert(
                    "User is offline."
                );
            };

        // =================================================
        // WEBRTC OFFER
        // =================================================

        const handleCallOffer =
            async ({
                offer,
                senderId
            }) => {
                try {
                    console.log(
                        "📥 WEBRTC OFFER RECEIVED"
                    );

                    if (
                        !localStream.current
                    ) {
                        console.log(
                            "❌ Local stream missing"
                        );

                        return;
                    }

                    const pc =
                        createPeerConnection(
                            senderId
                        );

                    // Remote description
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            offer
                        )
                    );

                    console.log(
                        "✅ REMOTE OFFER SET"
                    );

                    // =================================================
                    // ADD QUEUED ICE
                    // =================================================

                    for (
                        const candidate of
                            pendingIceCandidates.current
                    ) {
                        try {
                            await pc.addIceCandidate(
                                candidate
                            );
                        } catch (
                            error
                        ) {
                            console.log(
                                "PENDING ICE ERROR:",
                                error
                            );
                        }
                    }

                    pendingIceCandidates.current =
                        [];

                    // =================================================
                    // CREATE ANSWER
                    // =================================================

                    const answer =
                        await pc.createAnswer();

                    await pc.setLocalDescription(
                        answer
                    );

                    socket.emit(
                        "call:answer",
                        {
                            receiverId:
                                senderId,

                            answer
                        }
                    );

                    setCallStatus(
                        "Connecting..."
                    );

                    console.log(
                        "📤 WEBRTC ANSWER SENT"
                    );
                } catch (error) {
                    console.log(
                        "WEBRTC OFFER ERROR:",
                        error
                    );
                }
            };

        // =================================================
        // WEBRTC ANSWER
        // =================================================

        const handleCallAnswer =
            async ({
                answer
            }) => {
                try {
                    console.log(
                        "📥 WEBRTC ANSWER RECEIVED"
                    );

                    if (
                        !peerConnection.current
                    ) {
                        console.log(
                            "❌ PeerConnection missing"
                        );

                        return;
                    }

                    await peerConnection.current.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );

                    console.log(
                        "✅ REMOTE ANSWER SET"
                    );

                    // =================================================
                    // ADD QUEUED ICE
                    // =================================================

                    for (
                        const candidate of
                            pendingIceCandidates.current
                    ) {
                        try {
                            await peerConnection.current.addIceCandidate(
                                candidate
                            );
                        } catch (
                            error
                        ) {
                            console.log(
                                "PENDING ICE ERROR:",
                                error
                            );
                        }
                    }

                    pendingIceCandidates.current =
                        [];

                    setCallStatus(
                        "Connected"
                    );
                } catch (error) {
                    console.log(
                        "WEBRTC ANSWER ERROR:",
                        error
                    );
                }
            };

        // =================================================
        // ICE CANDIDATE
        // =================================================

        const handleIceCandidate =
            async ({
                candidate
            }) => {
                try {
                    if (!candidate) {
                        return;
                    }

                    const iceCandidate =
                        new RTCIceCandidate(
                            candidate
                        );

                    // Remote description already available
                    if (
                        peerConnection.current &&
                        peerConnection.current
                            .remoteDescription
                    ) {
                        await peerConnection.current.addIceCandidate(
                            iceCandidate
                        );

                        console.log(
                            "🧊 ICE CANDIDATE ADDED"
                        );
                    } else {
                        // Remote description abhi nahi aayi
                        console.log(
                            "🧊 ICE CANDIDATE QUEUED"
                        );

                        pendingIceCandidates.current.push(
                            iceCandidate
                        );
                    }
                } catch (error) {
                    console.log(
                        "ICE CANDIDATE ERROR:",
                        error
                    );
                }
            };

        // =================================================
        // CALL ENDED
        // =================================================

        const handleCallEnded =
            () => {
                console.log(
                    "📴 CALL ENDED BY OTHER USER"
                );

                stopRingtone();

                endCall(false);
            };

        // =================================================
        // SOCKET LISTENERS
        // =================================================

        socket.on(
            "receive_message",
            handleReceiveMessage
        );

        socket.on(
            "message_delivered",
            handleMessageDelivered
        );

        socket.on(
            "message_seen",
            handleMessageSeen
        );

        socket.on(
            "online-users",
            handleOnlineUsers
        );

        socket.on(
            "typing",
            handleTyping
        );

        socket.on(
            "stop_typing",
            handleStopTyping
        );

        // =================================================
        // CALL LISTENERS
        // =================================================

        socket.on(
            "call:incoming",
            handleIncomingCall
        );

        socket.on(
            "call:accepted",
            handleCallAccepted
        );

        socket.on(
            "call:rejected",
            handleCallRejected
        );

        socket.on(
            "call:user-offline",
            handleUserOffline
        );

        socket.on(
            "call:offer",
            handleCallOffer
        );

        socket.on(
            "call:answer",
            handleCallAnswer
        );

        socket.on(
            "call:ice-candidate",
            handleIceCandidate
        );

        socket.on(
            "call:ended",
            handleCallEnded
        );

        // =================================================
        // CLEANUP
        // =================================================

        return () => {
            socket.off(
                "receive_message",
                handleReceiveMessage
            );

            socket.off(
                "message_delivered",
                handleMessageDelivered
            );

            socket.off(
                "message_seen",
                handleMessageSeen
            );

            socket.off(
                "online-users",
                handleOnlineUsers
            );

            socket.off(
                "typing",
                handleTyping
            );

            socket.off(
                "stop_typing",
                handleStopTyping
            );

            socket.off(
                "call:incoming",
                handleIncomingCall
            );

            socket.off(
                "call:accepted",
                handleCallAccepted
            );

            socket.off(
                "call:rejected",
                handleCallRejected
            );

            socket.off(
                "call:user-offline",
                handleUserOffline
            );

            socket.off(
                "call:offer",
                handleCallOffer
            );

            socket.off(
                "call:answer",
                handleCallAnswer
            );

            socket.off(
                "call:ice-candidate",
                handleIceCandidate
            );

            socket.off(
                "call:ended",
                handleCallEnded
            );
        };
    }, [userId]);

    // =====================================================
    // AUTO SCROLL
    // =====================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    // =====================================================
    // TYPING CLEANUP
    // =====================================================

    useEffect(() => {
        return () => {
            clearTimeout(
                typingTimeout.current
            );
        };
    }, []);

    // =====================================================
    // DELETE MESSAGE
    // =====================================================

    const deleteMessage = async (
        messageId,
        deleteType
    ) => {
        try {
            await axios.delete(
                `https://orbit-backend-94nx.onrender.com/api/message/delete/${messageId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    },

                    data: {
                        deleteType
                    }
                }
            );

            setMessages(
                (prev) =>
                    prev.map(
                        (msg) => {
                            if (
                                msg._id !==
                                messageId
                            ) {
                                return msg;
                            }

                            if (
                                deleteType ===
                                "everyone"
                            ) {
                                return {
                                    ...msg,

                                    deletedForEveryone:
                                        true,

                                    message: "",
                                    image: "",
                                    video: "",
                                    file: ""
                                };
                            }

                            return {
                                ...msg,

                                deletedFor: [
                                    ...(msg.deletedFor ||
                                        []),

                                    currentUserId
                                ]
                            };
                        }
                    )
            );

            setMenuMessageId(null);
        } catch (err) {
            console.log(
                err.response?.data ||
                    err.message
            );
        }
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="chat-container">

            {/* =================================================
                INCOMING CALL
            ================================================= */}

            {callIncoming && (
                <div className="incoming-call">

                    <div className="incoming-call-icon">
                        {callType ===
                        "video"
                            ? "🎥"
                            : "📞"}
                    </div>

                    <h3>
                        {callType ===
                        "video"
                            ? "Incoming Video Call"
                            : "Incoming Audio Call"}
                    </h3>

                    <p>
                        {user?.username ||
                            "Someone"}{" "}
                        is calling you...
                    </p>

                    <div className="call-actions">

                        <button
                            className="accept-call-btn"
                            onClick={
                                acceptCall
                            }
                        >
                            ✅ Accept
                        </button>

                        <button
                            className="reject-call-btn"
                            onClick={
                                rejectCall
                            }
                        >
                            ❌ Reject
                        </button>

                    </div>
                </div>
            )}

            {/* =================================================
                ACTIVE CALL
            ================================================= */}

            {callActive && (
                <div className="call-screen">

                    {/* CALL STATUS */}

                    <div className="call-status">
                        {callType ===
                        "video"
                            ? "🎥 Video Call"
                            : "📞 Audio Call"}

                        {callStatus && (
                            <span>
                                {" "}
                                •{" "}
                                {callStatus}
                            </span>
                        )}
                    </div>

                    {/* REMOTE VIDEO */}

                    {callType ===
                        "video" && (
                        <video
                            ref={
                                remoteVideoRef
                            }
                            autoPlay
                            playsInline
                            className="remote-video"
                        />
                    )}

                    {/* REMOTE AUDIO */}

                    {callType ===
                        "audio" && (
                        <audio
                            ref={
                                remoteVideoRef
                            }
                            autoPlay
                            playsInline
                        />
                    )}

                    {/* LOCAL VIDEO */}

                    {callType ===
                        "video" && (
                        <video
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
                            className="local-video"
                        />
                    )}

                    {/* AUDIO CALL UI */}

                    {callType ===
                        "audio" && (
                        <div className="audio-call-avatar">

                            <img
                                src={
                                    user?.profileImage ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                alt=""
                            />

                            <h3>
                                {
                                    user?.username
                                }
                            </h3>

                            <p>
                                {callStatus ||
                                    "Calling..."}
                            </p>

                        </div>
                    )}

                    {/* END CALL */}

                    <button
                        className="end-call-btn"
                        onClick={() =>
                            endCall(true)
                        }
                    >
                        🔴
                    </button>

                </div>
            )}

            {/* =================================================
                CHAT HEADER
            ================================================= */}

            <div className="chat-header">

                <img
                    src={
                        user?.profileImage ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt=""
                    className="chat-avatar"
                />

                <div className="chat-user-info">

                    <h3>
                        {user?.username}
                    </h3>

                    <p
                        className={
                            online
                                ? "online"
                                : "offline"
                        }
                    >
                        {online
                            ? "🟢 Online"
                            : `Last seen ${formatLastSeen(
                                  user?.lastSeen
                              )}`}
                    </p>

                </div>

                {/* =================================================
                    CALL BUTTONS
                ================================================= */}

                <div className="call-buttons">

                    <button
                        className="call-btn"
                        disabled={
                            callActive ||
                            callIncoming
                        }
                        onClick={() =>
                            startCall(
                                "audio"
                            )
                        }
                        title="Audio Call"
                    >
                        📞
                    </button>

                    <button
                        className="call-btn"
                        disabled={
                            callActive ||
                            callIncoming
                        }
                        onClick={() =>
                            startCall(
                                "video"
                            )
                        }
                        title="Video Call"
                    >
                        🎥
                    </button>

                </div>

            </div>

            {/* =================================================
                CHAT BODY
            ================================================= */}

            <div className="chat-body">

                {messages.map(
                    (msg) => {

                        const isMyMessage =
                            String(
                                msg.sender
                            ) ===
                            String(
                                currentUserId
                            );

                        const isDeletedForMe =
                            msg.deletedFor?.some(
                                (id) =>
                                    String(
                                        id
                                    ) ===
                                    String(
                                        currentUserId
                                    )
                            );

                        if (
                            isDeletedForMe
                        ) {
                            return null;
                        }

                        return (
                            <div
                                key={
                                    msg._id
                                }
                                className={
                                    isMyMessage
                                        ? "my-message"
                                        : "other-message"
                                }
                            >

                                <div className="message-box">

                                    <button
                                        className="message-menu-btn"
                                        onClick={() =>
                                            setMenuMessageId(
                                                menuMessageId ===
                                                    msg._id
                                                    ? null
                                                    : msg._id
                                            )
                                        }
                                    >
                                        ⋮
                                    </button>

                                    {menuMessageId ===
                                        msg._id && (
                                        <div className="message-menu">

                                            <button
                                                onClick={() =>
                                                    deleteMessage(
                                                        msg._id,
                                                        "me"
                                                    )
                                                }
                                            >
                                                🗑️ Delete for me
                                            </button>

                                            {isMyMessage &&
                                                !msg.deletedForEveryone && (
                                                    <button
                                                        onClick={() =>
                                                            deleteMessage(
                                                                msg._id,
                                                                "everyone"
                                                            )
                                                        }
                                                    >
                                                        🗑️ Delete for everyone
                                                    </button>
                                                )}

                                        </div>
                                    )}

                                    {msg.deletedForEveryone ? (
                                        <p className="deleted-message">
                                            🚫 This message was deleted
                                        </p>
                                    ) : (
                                        <>
                                            {msg.image && (
                                                <img
                                                    src={
                                                        msg.image
                                                    }
                                                    alt="chat"
                                                    className="chat-image"
                                                />
                                            )}

                                            {msg.video && (
                                                <video
                                                    controls
                                                    className="chat-video"
                                                >
                                                    <source
                                                        src={
                                                            msg.video
                                                        }
                                                    />
                                                </video>
                                            )}

                                            {msg.file && (
                                                <a
                                                    href={
                                                        msg.file
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    📄 Download File
                                                </a>
                                            )}

                                            {msg.message && (
                                                <p>
                                                    {
                                                        msg.message
                                                    }
                                                </p>
                                            )}
                                        </>
                                    )}

                                    <span className="message-time">
                                        {new Date(
                                            msg.createdAt
                                        ).toLocaleTimeString(
                                            [],
                                            {
                                                hour:
                                                    "2-digit",
                                                minute:
                                                    "2-digit"
                                            }
                                        )}
                                    </span>

                                    {isMyMessage && (
                                        <span className="message-status">

                                            {msg.status ===
                                            "seen"
                                                ? "✓✓✓"
                                                : msg.status ===
                                                  "delivered"
                                                ? "✓✓"
                                                : "✓"}

                                        </span>
                                    )}

                                </div>

                            </div>
                        );
                    }
                )}

                {isTyping && (
                    <div className="typing-text">
                        ✍️{" "}
                        {user?.username}{" "}
                        is typing...
                    </div>
                )}

                <div
                    ref={
                        messagesEndRef
                    }
                />

            </div>

            {/* =================================================
                CHAT FOOTER
            ================================================= */}

            <div className="chat-footer">

                <input
                    type="file"
                    id="file"
                    hidden
                    onChange={(e) => {

                        const file =
                            e.target.files[0];

                        setSelectedFile(
                            file
                        );

                        if (file) {
                            setPreview(
                                URL.createObjectURL(
                                    file
                                )
                            );
                        }
                    }}
                />

                <label
                    htmlFor="file"
                    className="file-btn"
                >
                    📎
                </label>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => {

                        const value =
                            e.target.value;

                        setText(value);

                        if (
                            value.trim() ===
                            ""
                        ) {
                            clearTimeout(
                                typingTimeout.current
                            );

                            socket.emit(
                                "stop_typing",
                                {
                                    sender:
                                        currentUserId,

                                    receiver:
                                        userId
                                }
                            );

                            return;
                        }

                        socket.emit(
                            "typing",
                            {
                                sender:
                                    currentUserId,

                                receiver:
                                    userId
                            }
                        );

                        clearTimeout(
                            typingTimeout.current
                        );

                        typingTimeout.current =
                            setTimeout(
                                () => {
                                    socket.emit(
                                        "stop_typing",
                                        {
                                            sender:
                                                currentUserId,

                                            receiver:
                                                userId
                                        }
                                    );
                                },
                                1000
                            );
                    }}
                    placeholder="Type message..."
                    onKeyDown={(e) => {
                        if (
                            e.key ===
                            "Enter"
                        ) {
                            sendMessage();
                        }
                    }}
                />

                <button
                    onClick={
                        sendMessage
                    }
                >
                    ➤
                </button>

            </div>

        </div>
    );
}

export default Chat;