import { request_gpt } from '../api';

import { Context } from 'koa';

export async function ApiController(ctx: Context) {
  const req = ctx.request as any;
  const msg = req.body.payload;
  const id = req.body.id != '' ? req.body.id : undefined;
  try {
    const reponse = await request_gpt(msg, id);
    ctx.body = {
      id: reponse.id,
      msg: reponse.msg,
    };
  } catch (error) {
    ctx.body = {
      result: `Error: \n ${error.message} \n Stack: \n ${error.stack}`,
    };
  }
}

