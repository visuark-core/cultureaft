const mongoose = require('mongoose');
const DeliveryAgent = require('../models/DeliveryAgent');
require('dotenv').config({ path: './.env' });

const sampleDeliveryAgents = [
  {
    profile: {
      employeeId: "DA001",
      name: "Rajesh Kumar",
      phone: "+919876543210",
      email: "rajesh.kumar@cultureaft.com",
      address: {
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      },
      dateOfBirth: new Date("1990-05-15"),
      emergencyContact: {
        name: "Sunita Kumar",
        phone: "+919876543211",
        relationship: "Wife"
      }
    },
    employment: {
      joinDate: new Date("2023-01-15"),
      status: "active",
      employmentType: "full_time",
      salary: 25000,
      department: "Delivery"
    },
    vehicle: {
      type: "bike",
      registrationNumber: "MH01AB1234",
      model: "Honda Activa",
      insuranceExpiry: new Date("2024-12-31"),
      licenseNumber: "MH0120230001"
    },
    availability: {
      isAvailable: true,
      workingHours: {
        monday: { start: "09:00", end: "18:00", isWorking: true },
        tuesday: { start: "09:00", end: "18:00", isWorking: true },
        wednesday: { start: "09:00", end: "18:00", isWorking: true },
        thursday: { start: "09:00", end: "18:00", isWorking: true },
        friday: { start: "09:00", end: "18:00", isWorking: true },
        saturday: { start: "09:00", end: "15:00", isWorking: true },
        sunday: { start: "10:00", end: "14:00", isWorking: false }
      }
    },
    location: {
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        timestamp: new Date()
      },
      assignedZones: [
        {
          name: "Mumbai Central",
          pincodes: ["400001", "400002", "400003"],
          priority: "primary"
        }
      ]
    },
    performance: {
      totalDeliveries: 150,
      successfulDeliveries: 142,
      failedDeliveries: 8,
      averageDeliveryTime: 45,
      customerRating: 4.2,
      deliverySuccessRate: 94.67,
      onTimeDeliveryRate: 89.33,
      totalRatings: 120,
      ratingSum: 504
    }
  },
  {
    profile: {
      employeeId: "DA002",
      name: "Amit Sharma",
      phone: "+919876543220",
      email: "amit.sharma@cultureaft.com",
      address: {
        street: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India"
      },
      dateOfBirth: new Date("1988-08-22"),
      emergencyContact: {
        name: "Priya Sharma",
        phone: "+919876543221",
        relationship: "Wife"
      }
    },
    employment: {
      joinDate: new Date("2022-11-10"),
      status: "active",
      employmentType: "full_time",
      salary: 28000,
      department: "Delivery"
    },
    vehicle: {
      type: "scooter",
      registrationNumber: "DL01CD5678",
      model: "TVS Jupiter",
      insuranceExpiry: new Date("2024-11-30"),
      licenseNumber: "DL0120220002"
    },
    availability: {
      isAvailable: true,
      workingHours: {
        monday: { start: "08:00", end: "17:00", isWorking: true },
        tuesday: { start: "08:00", end: "17:00", isWorking: true },
        wednesday: { start: "08:00", end: "17:00", isWorking: true },
        thursday: { start: "08:00", end: "17:00", isWorking: true },
        friday: { start: "08:00", end: "17:00", isWorking: true },
        saturday: { start: "08:00", end: "14:00", isWorking: true },
        sunday: { start: "10:00", end: "14:00", isWorking: false }
      }
    },
    location: {
      currentLocation: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 15,
        timestamp: new Date()
      },
      assignedZones: [
        {
          name: "Delhi Central",
          pincodes: ["110001", "110002", "110003"],
          priority: "primary"
        }
      ]
    },
    performance: {
      totalDeliveries: 200,
      successfulDeliveries: 185,
      failedDeliveries: 15,
      averageDeliveryTime: 38,
      customerRating: 4.5,
      deliverySuccessRate: 92.5,
      onTimeDeliveryRate: 91.0,
      totalRatings: 165,
      ratingSum: 742.5
    }
  },
  {
    profile: {
      employeeId: "DA003",
      name: "Suresh Patel",
      phone: "+919876543230",
      email: "suresh.patel@cultureaft.com",
      address: {
        street: "789 Gandhi Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: "India"
      },
      dateOfBirth: new Date("1992-03-10"),
      emergencyContact: {
        name: "Meera Patel",
        phone: "+919876543231",
        relationship: "Sister"
      }
    },
    employment: {
      joinDate: new Date("2023-06-01"),
      status: "active",
      employmentType: "part_time",
      salary: 15000,
      department: "Delivery"
    },
    vehicle: {
      type: "bicycle",
      registrationNumber: "N/A",
      model: "Hero Cycle",
      insuranceExpiry: null,
      licenseNumber: "N/A"
    },
    availability: {
      isAvailable: false,
      workingHours: {
        monday: { start: "14:00", end: "20:00", isWorking: true },
        tuesday: { start: "14:00", end: "20:00", isWorking: true },
        wednesday: { start: "14:00", end: "20:00", isWorking: true },
        thursday: { start: "14:00", end: "20:00", isWorking: true },
        friday: { start: "14:00", end: "20:00", isWorking: true },
        saturday: { start: "10:00", end: "18:00", isWorking: true },
        sunday: { start: "10:00", end: "16:00", isWorking: true }
      }
    },
    location: {
      currentLocation: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 8,
        timestamp: new Date()
      },
      assignedZones: [
        {
          name: "Bangalore Central",
          pincodes: ["560001", "560002", "560003"],
          priority: "secondary"
        }
      ]
    },
    performance: {
      totalDeliveries: 75,
      successfulDeliveries: 70,
      failedDeliveries: 5,
      averageDeliveryTime: 52,
      customerRating: 4.0,
      deliverySuccessRate: 93.33,
      onTimeDeliveryRate: 86.67,
      totalRatings: 60,
      ratingSum: 240
    }
  }
];

async function seedDeliveryAgents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing delivery agents
    await DeliveryAgent.deleteMany({});
    console.log('Cleared existing delivery agents');

    // Insert sample delivery agents
    const insertedAgents = await DeliveryAgent.insertMany(sampleDeliveryAgents);
    console.log(`Inserted ${insertedAgents.length} sample delivery agents`);

    console.log('Sample delivery agents:');
    insertedAgents.forEach(agent => {
      console.log(`- ${agent.profile.name} (${agent.profile.employeeId}) - ${agent.employment.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding delivery agents:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDeliveryAgents();