import { decode, verify } from "hono/jwt";

import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/extension";
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
        c.set("userId", userId);
        next();
    }else{
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
    next();
})

blogRouter.get("/", async(c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

 
    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: body.id,
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


blogRouter.post("/api/v1/blog", async(c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.create({
    data: {
        title: body.title,
        content: body.content,
        authorId: 1
    }
  })

  return c.json({
    id: blog.id
  })
});

blogRouter.put("/api/v1/blog", async(c) => {
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

blogRouter.get('/bulk', async(c) =>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.blog.findMany();


    return c.json({
        blogs
    })
})
