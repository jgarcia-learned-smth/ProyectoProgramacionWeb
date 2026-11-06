import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('demo-password', 12)
  const user = await prisma.user.upsert({
    where: { email: 'laura@example.com' },
    update: { passwordHash },
    create: {
      name: 'Laura C.',
      email: 'laura@example.com',
      passwordHash,
      role: 'Administrador',
      preferences: { create: {} },
    },
  })

  const workspace = await prisma.workspace.upsert({
    where: { id: 'workspace-product-voltage' },
    update: { name: 'Product voltage' },
    create: { id: 'workspace-product-voltage', name: 'Product voltage' },
  })

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: 'owner' },
    create: { userId: user.id, workspaceId: workspace.id, role: 'owner' },
  })

  const columns = [
    { id: 'backlog', title: 'Backlog', color: '#D8D5CB', position: 0 },
    { id: 'in-progress', title: 'En curso', color: '#F5DC6A', position: 1 },
    { id: 'review', title: 'Revisión', color: '#CBE5D8', position: 2 },
    { id: 'done', title: 'Completado', color: '#CAD8EA', position: 3 },
  ]

  for (const column of columns) {
    await prisma.column.upsert({
      where: { id: column.id },
      update: { ...column, workspaceId: workspace.id },
      create: { ...column, workspaceId: workspace.id },
    })
  }

  await prisma.task.upsert({
    where: { id: 'task-design-system' },
    update: {},
    create: {
      id: 'task-design-system',
      workspaceId: workspace.id,
      columnId: 'in-progress',
      title: 'Refinar tokens de diseño',
      description: 'Alinear los tokens visuales del workspace.',
      tag: 'Producto',
      priority: 'Alta',
      assigneeId: user.id,
      estimate: '5 pts',
      date: '25 JUN',
      position: 0,
      comments: {
        create: {
          authorId: user.id,
          author: 'LC',
          text: 'Revisar el contraste de los estados activos.',
        },
      },
    },
  })

  for (const integration of [
    { name: 'Slack', description: 'Notificaciones de trabajo' },
    { name: 'Trello', description: 'Sincronización de tableros' },
  ]) {
    await prisma.integration.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: integration.name } },
      update: { description: integration.description },
      create: { ...integration, workspaceId: workspace.id },
    })
  }

  await prisma.notification.upsert({
    where: { id: 'notification-welcome' },
    update: {
      userId: user.id,
      workspaceId: workspace.id,
      title: 'Workspace inicial creado',
      detail: 'Tu workspace de desarrollo está listo.',
    },
    create: {
      id: 'notification-welcome',
      userId: user.id,
      workspaceId: workspace.id,
      title: 'Workspace inicial creado',
      detail: 'Tu workspace de desarrollo está listo.',
    },
  })

  console.log(`Seed completed for ${user.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
