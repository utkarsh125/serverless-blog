import {decode, sign, verify} from "hono/jwt";

import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const app = new Hono<{
  Bindings:{
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/v1/signup", async (c) => {
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

app.post("/api/v1/signin", async(c) => {
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

app.get("/api/v1/blog/:id", (c) => {
  const id = c.req.param("id");
  console.log(id);
  return c.text("get blog route");
});

app.post("/api/v1/blog", (c) => {
  return c.text("signin route");
});

app.put("/api/v1/blog", (c) => {
  return c.text("signin route");
});

export default app;
