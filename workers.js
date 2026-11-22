const workersArr = [
  ["Chinnilal Mahato", "Others", "A"],
  ["Ranjeet Yadav", "Others", "A"],
  ["Chandan Mahato", "Others", "A"],
  ["Madhusudan", "Others", "A"],
  ["Sukhdeb", "Others", "A"],
  ["Sonu", "Others", "A"],
  ["Deepak-2", "Others", "A"],
  ["Nilkanth", "Others", "A"],
  ["Himadar", "Others", "A"],
  ["Tikechan", "Others", "A"],
  ["Akash", "Others", "A"],
  ["Sameer", "Others", "A"],
  ["Sashi Pandey", "Others", "A"],
  ["Anuradha", "Others", "A"],
  ["Dhileswar", "Others", "A"],
  ["Vijayasree", "Others", "A"],
  ["Banisree", "Others", "A"],
  ["Prakash Mohali", "Others", "B"],
  ["Anil Bhoi", "Others", "A"],
  ["Ketra", "Others", "A"]
];

const jsonData = {
  workers: workersArr.map(([name, role, shift]) => ({
    name,
    role,
    shift,
    status: "HW"
  })),
  activeMachines: [2, 4],
  filter: "ALL"
};

const jsonString = JSON.stringify(jsonData, null, 2);