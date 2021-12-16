import { PrismaClient } from "@prisma/client";
import { users } from './users';

const prisma = new PrismaClient();

async function main() {
    await prisma.city.create({
        data: {
            'name' : 'Bordeaux',
            'postalCode' : "33000"
        }
    })
    for (let user of users) {
        await prisma.user.create({
            data: user
        })
    }
}

main().catch(e => {
    console.log(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect()
});