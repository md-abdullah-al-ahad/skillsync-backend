import { prisma } from "./lib/prisma";
import app from "./app";
const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};
main();
