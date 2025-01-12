// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient({
//   log: ["query", "info", "warn", "error"],
// });

// const shutDownGracefully = async () => {
//   await prisma.$disconnect();
// };

// process.on("SIGINT", shutDownGracefully);
// process.on("SIGTERM", shutDownGracefully);

// export default prisma;


// matikan log

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;