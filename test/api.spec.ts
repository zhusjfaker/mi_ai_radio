import { request_gpt } from "../src/api";

describe("GPT-3 API", () => {
  test("should env have OPENAI_API_KEY", () => {
    Object.keys(process.env).forEach((key) => {
      if (key === "OPENAI_API_KEY") {
        console.log(`${key}: ${process.env[key]}`);
      }
    });
    expect(Object.keys(process.env).includes("OPENAI_API_KEY")).toBe(true);
  });

  test("should return a response", async () => {
    let message = "香港回归中国的准确时间";
    let resp = await request_gpt(message);

    expect(resp.msg.includes("1997年7月1日")).toBe(true);

    message = "我刚刚问了什么?";
    resp = await request_gpt(message, resp.id);

    expect(resp.msg.includes("香港回归中国的准确时间")).toBe(true);
  }, 60000);
});
