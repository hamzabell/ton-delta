
import { prisma } from '../src/lib/prisma';

async function main() {
    const id = 'e74d9620-8e18-4ce6-b853-f225831940ee';
    console.log(`Resetting position ${id} to active...`);
    
    try {
        await prisma.position.update({
            where: { id },
            data: { status: 'active' }
        });
        console.log('Success!');
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
