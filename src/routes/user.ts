import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { sign } from "hono/jwt";
import { withAccelerate } from "@prisma/extension-accelerate";

export const userRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.post("/signup", async (c) => {
  const body = await c.req.json();

  //Prisma initialization is needed inside each route
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  //TODO: zod as validation library
  //TODO: hash passwords
  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
      }
    })

    const jwt = await sign({
      id: user.id,
    }, c.env.JWT_SECRET);
    
    return c.text(jwt);

    
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Invalid");
  }
});

userRouter.post("/signin", async(c) => {
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  })

  try{
    const user = await prisma.user.findFirst({
      where:{
        username: body.username,
        password: body.password,
      }
    })

    if(!user){
      c.status(403);
      return c.text("Invalid Credentials");
    }

    const jwt = await sign({
      id: user.id,
    }, c.env.JWT_SECRET);

    return c.text(jwt);
  }catch(e){
    console.log(e);
    c.status(411);
    return c.text("Invalid");
  }

});