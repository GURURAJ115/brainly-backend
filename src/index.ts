import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { ContentModel, LinkModel, UserModel } from './db'
import { JWT_PASSWORD } from './config'
import { userMiddleware } from './middleware'
import { random } from './utils'
import cors from "cors"
const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/v1/signup', async (req, res) => { 
    const username = req.body.username;
    const password = req.body.password;

    try{
        await UserModel.create({
            username: username,
            password: password
        })
    
        res.json({
            message: "User signed up"
        })
    }
    catch(e){
        res.status(411).json({
            message: "User already exists"
        })
    }
})

app.post('/api/v1/signin', async(req, res) => { 
    const username = req.body.username;
    const password = req.body.password;
    const existingUser = await UserModel.findOne({
        username,
        password
    })
    if(existingUser){
        const token = jwt.sign({
            id: existingUser._id
        }, JWT_PASSWORD)
        res.json({
            token
        })
    }else{
        res.status(403).json({
            message:"Incorrect credentials"
        })
    }
})

app.post('/api/v1/content',userMiddleware, async(req, res) => { 
    const link = req.body.link;
    const type = req.body.type;
    await ContentModel.create({
        link,
        type,
        title: req.body.title,
        userId: req.userId,
        tags:[]
    })

    res.json({
        message:"content added"
    })

})

app.get('/api/v1/content',userMiddleware, async (req, res) => { 
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId","username")
    res.json({
        content
    })
})

app.delete('/api/v1/content', userMiddleware, async (req,res) =>{
    try {
        const contentId = req.body.contentId;

        if (!contentId) {
            res.status(400).json({ message: "Content ID is required" });
            return;
        }

        const deletedContent = await ContentModel.deleteOne({
            _id: contentId,
            userId: req.userId
        });

        if (deletedContent.deletedCount === 0) {
            res.status(404).json({ message: "Content not found or unauthorized" });
            return;
        }

        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting content:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.put('/api/v1/content', userMiddleware, async (req, res) => {
    const { contentId, title, link, type } = req.body;

    if (!contentId || !title || !link || !type) {
        res.status(400).json({ message: "All fields are required" });
        return;
    }

    try {
        const updatedContent = await ContentModel.findOneAndUpdate(
            { _id: contentId, userId: req.userId },
            { title, link, type },
            { new: true }
        );

        if (!updatedContent) {
            res.status(404).json({ message: "Content not found or unauthorized" });
            return;
        }

        res.json({ message: "Updated successfully", content: updatedContent });
    } catch (error) {
        console.error("Error updating content:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/api/v1/brain/share',userMiddleware, async(req, res) => { 
    const share = req.body.share
    if(share){
        const existingLink = await LinkModel.findOne({
            userId: req.userId
        });
        if(existingLink){
            res.json({
                hash: existingLink.hash
            })
            return;
        }
        const hash = random(10)
        await LinkModel.create({
            userId: req.userId,
            hash: hash
        })
        res.json({
            message:"/share/"+hash
        })
    }
    else{
        await LinkModel.deleteOne({
            userId: req.userId
        });
        res.json({
            message:"Removed link"
        })
    }
    
})

app.get('/api/v1/brain/:shareLink', async(req, res) => { 
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if(!link){
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }

    const content = await ContentModel.find({
        userId: link.userId
    })

    const user = await UserModel.findOne({
        _id: link.userId
    })

    if(!user){
        res.status(411).json({
            message: "User not found, error should ideally not happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })
})


const port = 3000
app.listen(port);