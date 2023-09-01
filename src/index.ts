import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "@koa/bodyparser";
import { ApiController, MainController } from "./controller";

const app = new Koa();
const app_router = new Router();

app.use(bodyParser());
app.use(app_router.routes()).use(app_router.allowedMethods());

app_router.get("/", MainController);
app_router.post("/api", ApiController);

app.listen(3000);
