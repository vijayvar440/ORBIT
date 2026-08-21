import { useState , useEffect } from "react";
import axios from "axios";
import { useNavigate,useParams } from "react-router-dom";   

function EditPost(){
    const navigate  = useNavigate();
    const {id} = useParams();


    const [title,setTitle] = useState("");
    const[description,setDescription] = useState("");
    const[media,setMedia] = useState(null);
     const fetchPost = async () => {
        try{
            const response = await axios.get(
               "https://orbit-backend-94nx.onrender.com/api/Post/all-posts"
            );

            const post = response.data.posts.find((p) => p._id === id);

            if(post){
                setTitle(post.title);
                setDescription(post.description);

            }


            }catch(err){
                console.log(err.response?.data||err.message)

            }

    };

      useEffect(() => {
       fetchPost();
     }, []);
    const handleUpdate = async (e) => {

    e.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);

    if (media) {
        formData.append("media", media);
    }

    try {

        await axios.put(
            `https://orbit-backend-94nx.onrender.com/api/Post/update/${id}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        alert("Post Updated Successfully ✅");

        navigate("/");

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};

return (

    <div className="edit-post-container">

        <h1>Edit Post</h1>

        <form onSubmit={handleUpdate}>

            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <br /><br />

            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <br /><br />

            <input
                type="file"
                onChange={(e) => setMedia(e.target.files[0])}
            />

            <br /><br />

            <button type="submit">
                Update Post
            </button>

        </form>

    </div>

);

}

export default EditPost;

        
    