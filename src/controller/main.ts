import { Context } from "koa";

export function MainController(ctx: Context) {
  ctx.body = {
    content: "Hello World",
  };
}
