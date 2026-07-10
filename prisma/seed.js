const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.punchRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.workspace.deleteMany();

  console.log("Seeding workspace...");
  const workspace = await prisma.workspace.create({
    data: {
      name: "ANSH Solutions",
    },
  });

  const wid = workspace.id;

  console.log("Seeding employees...");
  
  const rahul = await prisma.employee.create({
    data: {
      id: "emp-1",
      name: "Rahul Raj",
      email: "rahul.raj@ansh.com",
      role: "HR Manager",
      department: "Human Resources",
      avatarInitials: "RR",
      status: "Active",
      wid: wid,
    },
  });

  const priya = await prisma.employee.create({
    data: {
      id: "emp-2",
      name: "Priya Sharma",
      email: "priya.sharma@ansh.com",
      role: "Employee",
      department: "Engineering",
      avatarInitials: "PS",
      status: "Active",
      wid: wid,
    },
  });

  const amit = await prisma.employee.create({
    data: {
      id: "emp-3",
      name: "Amit Patel",
      email: "amit.patel@ansh.com",
      role: "Employee",
      department: "Product Design",
      avatarInitials: "AP",
      status: "On Leave",
      wid: wid,
    },
  });

  const sneha = await prisma.employee.create({
    data: {
      id: "emp-4",
      name: "Sneha Reddy",
      email: "sneha.reddy@ansh.com",
      role: "Employee",
      department: "Data Analytics",
      avatarInitials: "SR",
      status: "Half-day",
      wid: wid,
    },
  });

  const rohan = await prisma.employee.create({
    data: {
      id: "emp-5",
      name: "Rohan Gupta",
      email: "rohan.gupta@ansh.com",
      role: "Employee",
      department: "Engineering (QA)",
      avatarInitials: "RG",
      status: "Active",
      wid: wid,
    },
  });

  const vikram = await prisma.employee.create({
    data: {
      id: "emp-6",
      name: "Vikram Malhotra",
      email: "vikram.m@ansh.com",
      role: "Admin",
      department: "Executive",
      avatarInitials: "VM",
      status: "Active",
      wid: wid,
    },
  });

  console.log("Seeding leave categories...");
  await prisma.leaveCategory.createMany({
    data: [
      { name: "Annual", days: 15, color: "violet", wid },
      { name: "Sick", days: 8, color: "sky", wid },
      { name: "Casual", days: 6, color: "emerald", wid },
    ],
  });

  console.log("Seeding leave requests...");
  await prisma.leaveRequest.createMany({
    data: [
      {
        id: "req-1",
        employeeId: priya.id,
        type: "Annual",
        startDate: "2026-06-10",
        endDate: "2026-06-13",
        totalDays: 3,
        halfDay: false,
        reason: "Going on a family trip to Himachal",
        status: "Pending",
        wid: wid,
        appliedAt: new Date("2026-05-28T09:15:00.000Z"),
      },
      {
        id: "req-2",
        employeeId: amit.id,
        type: "Sick",
        startDate: "2026-05-29",
        endDate: "2026-05-29",
        totalDays: 1,
        halfDay: false,
        reason: "Severe dental checkup and surgery",
        status: "Pending",
        wid: wid,
        appliedAt: new Date("2026-05-29T07:30:00.000Z"),
      },
      {
        id: "req-3",
        employeeId: sneha.id,
        type: "Casual",
        startDate: "2026-05-29",
        endDate: "2026-05-29",
        totalDays: 0.5,
        halfDay: true,
        reason: "Urgent personal work at the bank in the afternoon",
        status: "Approved",
        wid: wid,
        appliedAt: new Date("2026-05-27T14:22:00.000Z"),
      },
      {
        id: "req-4",
        employeeId: rahul.id,
        type: "Annual",
        startDate: "2026-05-15",
        endDate: "2026-05-18",
        totalDays: 3,
        halfDay: false,
        reason: "Extended weekend trip",
        status: "Approved",
        wid: wid,
        appliedAt: new Date("2026-05-10T10:00:00.000Z"),
      },
      {
        id: "req-5",
        employeeId: rohan.id,
        type: "Casual",
        startDate: "2026-05-05",
        endDate: "2026-05-05",
        totalDays: 1,
        halfDay: false,
        reason: "Sister's graduation ceremony",
        status: "Rejected",
        wid: wid,
        appliedAt: new Date("2026-05-02T11:45:00.000Z"),
      },
    ],
  });

  console.log("Seeding punch records for Rahul Raj...");
  await prisma.punchRecord.createMany({
    data: [
      {
        id: "p-1",
        employeeId: rahul.id,
        date: "2026-05-28",
        punchIn: "09:05 AM",
        punchOut: "06:12 PM",
        duration: "9h 07m",
        status: "On-time",
        wid: wid,
      },
      {
        id: "p-2",
        employeeId: rahul.id,
        date: "2026-05-27",
        punchIn: "09:45 AM",
        punchOut: "06:05 PM",
        duration: "8h 20m",
        status: "Late",
        wid: wid,
      },
      {
        id: "p-3",
        employeeId: rahul.id,
        date: "2026-05-26",
        punchIn: "08:58 AM",
        punchOut: "05:30 PM",
        duration: "8h 32m",
        status: "On-time",
        wid: wid,
      },
      {
        id: "p-4",
        employeeId: rahul.id,
        date: "2026-05-25",
        punchIn: "09:02 AM",
        punchOut: "06:00 PM",
        duration: "8h 58m",
        status: "On-time",
        wid: wid,
      },
      {
        id: "p-5",
        employeeId: rahul.id,
        date: "2026-05-22",
        punchIn: "01:00 PM",
        punchOut: "06:00 PM",
        duration: "5h 00m",
        status: "Half-day",
        wid: wid,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
