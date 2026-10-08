import { env } from "./env";
import { createApp } from "./app";

createApp().then((app) => {
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Linkly running on http://localhost:${env.port}`);
  });
});
