import { decode, verify } from "hono/jwt";

import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables:{
        userId: string;
    }
}>();

//middleware is the place where you take the token from the user and pass it down to the router
blogRouter.use("/*", async(c, next) => {

    //extract the user id
    //pass it down to the route handler

    const authHeader = c.req.header("authorization") || "";
    const user = await verify(authHeader, c.env.JWT_SECRET);

    if(user){
        const userId = String(user.id);
        c.set("userId", userId);//basically you are fetching the user id from the token
        //and then passing it to the the get handler
        //set() and get() @hono/docs
        
        await next();
    }else{
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
})

blogRouter.get('/bulk', async(c) =>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.blog.findMany();


    return c.json({
        blogs
    })
})

blogRouter.get("/:id", async(c) => {
    // const body = await c.req.json();
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

 
    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id),
            }
        })

        return c.json({
            blog
        })
    } catch (error) {
        c.status(411);
        return c.json({
            message: "Error while fetching blog post"
        });
    }
});


blogRouter.post("/", async(c) => {
  const body = await c.req.json();
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.create({
    data: {
        title: body.title,
        content: body.content,
        authorId: Number(authorId)
    }
  })

  return c.json({
    id: blog.id
  })
});

blogRouter.put("/blog", async(c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());


  const blog = await prisma.blog.update({
    where:{
        id: body.id
    },
    data: {
        title: body.title,
        content: body.content,
    }
  })

  return c.json({
    id: blog.id
  })
});


