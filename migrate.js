// migrateFields.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function migrateField(fieldOld, fieldNew) {
    const entries = await prisma.malkhanaEntry.findMany({
        where: { [fieldOld]: { not: null } },
    });

    for (const entry of entries) {
        const raw = entry[fieldOld];
        const parsed = parseInt(raw, 10);

        if (!isNaN(parsed)) {
            await prisma.malkhanaEntry.update({
                where: { id: entry.id },
                data: { [fieldNew]: parsed },
            });
            console.log(`✅ ${fieldOld} (${raw}) → ${fieldNew} (${parsed})`);
        } else {
            console.warn(`⚠️ Skipped ${fieldOld} for entry ${entry.id}: "${raw}"`);
        }
    }
}

async function main() {
    console.log("🚀 Starting migration...");

    await migrateField("srNo", "srNoInt");
    await migrateField("gdNo", "gdNoInt");
    await migrateField("Year", "YearInt");
    await migrateField("boxNo", "boxNoInt");
    await migrateField("wine", "wineInt");
    await migrateField("cash", "cashInt");
    await migrateField("yellowItemPrice", "yellowItemPriceInt");

    console.log("🎉 Migration complete!");
}

main()
    .catch((err) => {
        console.error("❌ Migration failed:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
