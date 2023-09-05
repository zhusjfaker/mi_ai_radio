import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from '@koa/bodyparser';
import { ApiController, MainController } from './controller';
import { execSync } from 'node:child_process';

execSync('rm -rf ./token/*.json', {
  stdio: 'inherit',
  shell: '/bin/bash',
  cwd: process.cwd(),
  env: process.env,
});

const app = new Koa();
const app_router = new Router();

app.use(bodyParser());
app.use(app_router.routes()).use(app_router.allowedMethods());

app_router.get('/', MainController);
app_router.post('/api', ApiController);

app.listen(3000);
