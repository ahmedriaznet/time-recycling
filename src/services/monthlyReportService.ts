import AsyncStorage from "@react-native-async-storage/async-storage";
import EmailService from "./emailService";

export interface MonthlyReportData {
  month: string;
  year: number;
  vendorReports: VendorMonthlyData[];
  driverReports: DriverMonthlyData[];
}

export interface VendorMonthlyData {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalPickups: number;
  totalBottles: number;
  completedPickups: number;
  pendingPickups: number;
  topDrivers: string[];
  sustainabilityImpact: {
    co2Saved: number;
    wasteReduced: number;
  };
}

export interface DriverMonthlyData {
  driverId: string;
  driverName: string;
  driverEmail: string;
  totalPickups: number;
  totalBottles: number;
  totalDistance: number;
  earnings: number;
  topVendors: string[];
  rating: number;
  sustainabilityImpact: {
    co2Saved: number;
    wasteReduced: number;
  };
}

export class MonthlyReportService {
  private static instance: MonthlyReportService;

  public static getInstance(): MonthlyReportService {
    if (!MonthlyReportService.instance) {
      MonthlyReportService.instance = new MonthlyReportService();
    }
    return MonthlyReportService.instance;
  }

  // Calculate sustainability impact based on bottles collected
  private calculateSustainabilityImpact(bottleCount: number) {
    // Estimates based on recycling data
    const co2SavedPerBottle = 0.12; // kg CO2 saved per bottle
    const wasteReducedPerBottle = 0.025; // kg waste reduced per bottle

    return {
      co2Saved: Math.round(bottleCount * co2SavedPerBottle * 100) / 100,
      wasteReduced: Math.round(bottleCount * wasteReducedPerBottle * 100) / 100,
    };
  }

  // Generate vendor monthly report data
  async generateVendorReport(
    vendorId: string,
    month: string,
    year: number,
  ): Promise<VendorMonthlyData> {
    // In a real app, this would query your database for actual pickup data
    // For demo purposes, we'll generate sample data

    const sampleData: VendorMonthlyData = {
      vendorId,
      vendorName: "Demo Restaurant",
      vendorEmail: "vendor@example.com",
      totalPickups: Math.floor(Math.random() * 20) + 10, // 10-30 pickups
      totalBottles: Math.floor(Math.random() * 500) + 200, // 200-700 bottles
      completedPickups: Math.floor(Math.random() * 18) + 8, // 8-26 completed
      pendingPickups: Math.floor(Math.random() * 3), // 0-3 pending
      topDrivers: ["John Smith", "Sarah Johnson", "Mike Davis"],
      sustainabilityImpact: { co2Saved: 0, wasteReduced: 0 },
    };

    // Calculate sustainability impact
    sampleData.sustainabilityImpact = this.calculateSustainabilityImpact(
      sampleData.totalBottles,
    );

    return sampleData;
  }

  // Generate driver monthly report data
  async generateDriverReport(
    driverId: string,
    month: string,
    year: number,
  ): Promise<DriverMonthlyData> {
    // In a real app, this would query your database for actual pickup data
    // For demo purposes, we'll generate sample data

    const sampleData: DriverMonthlyData = {
      driverId,
      driverName: "Demo Driver",
      driverEmail: "driver@example.com",
      totalPickups: Math.floor(Math.random() * 30) + 15, // 15-45 pickups
      totalBottles: Math.floor(Math.random() * 800) + 300, // 300-1100 bottles
      totalDistance: Math.floor(Math.random() * 200) + 100, // 100-300 km
      earnings: Math.floor(Math.random() * 800) + 400, // $400-1200
      topVendors: ["The Green Pub", "Eco Restaurant", "Sustainable Bistro"],
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
      sustainabilityImpact: { co2Saved: 0, wasteReduced: 0 },
    };

    // Calculate sustainability impact
    sampleData.sustainabilityImpact = this.calculateSustainabilityImpact(
      sampleData.totalBottles,
    );

    return sampleData;
  }

  // Send monthly reports to all vendors
  async sendVendorMonthlyReports(month: string, year: number): Promise<number> {
    try {
      console.log(`📊 Generating vendor monthly reports for ${month} ${year}`);

      // In a real app, you'd get all vendor IDs from your database
      const vendorIds = ["vendor1", "vendor2", "vendor3"]; // Sample vendor IDs
      let successCount = 0;

      for (const vendorId of vendorIds) {
        try {
          const reportData = await this.generateVendorReport(
            vendorId,
            month,
            year,
          );

          const success = await EmailService.sendVendorMonthlyReport(
            reportData.vendorEmail,
            {
              vendorName: reportData.vendorName,
              month,
              year,
              totalPickups: reportData.totalPickups,
              totalBottles: reportData.totalBottles,
              completedPickups: reportData.completedPickups,
              pendingPickups: reportData.pendingPickups,
              topDrivers: reportData.topDrivers,
              sustainabilityImpact: reportData.sustainabilityImpact,
            },
          );

          if (success) {
            successCount++;
            console.log(
              `✅ Monthly report sent to vendor: ${reportData.vendorName}`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to send report to vendor ${vendorId}:`,
            error,
          );
        }
      }

      console.log(
        `📧 Sent ${successCount}/${vendorIds.length} vendor monthly reports`,
      );
      return successCount;
    } catch (error) {
      console.error("❌ Error sending vendor monthly reports:", error);
      return 0;
    }
  }

  // Send monthly reports to all drivers
  async sendDriverMonthlyReports(month: string, year: number): Promise<number> {
    try {
      console.log(`📊 Generating driver monthly reports for ${month} ${year}`);

      // In a real app, you'd get all driver IDs from your database
      const driverIds = ["driver1", "driver2", "driver3", "driver4"]; // Sample driver IDs
      let successCount = 0;

      for (const driverId of driverIds) {
        try {
          const reportData = await this.generateDriverReport(
            driverId,
            month,
            year,
          );

          const success = await EmailService.sendDriverMonthlyReport(
            reportData.driverEmail,
            {
              driverName: reportData.driverName,
              month,
              year,
              totalPickups: reportData.totalPickups,
              totalBottles: reportData.totalBottles,
              totalDistance: reportData.totalDistance,
              earnings: reportData.earnings,
              topVendors: reportData.topVendors,
              rating: reportData.rating,
              sustainabilityImpact: reportData.sustainabilityImpact,
            },
          );

          if (success) {
            successCount++;
            console.log(
              `✅ Monthly report sent to driver: ${reportData.driverName}`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to send report to driver ${driverId}:`,
            error,
          );
        }
      }

      console.log(
        `📧 Sent ${successCount}/${driverIds.length} driver monthly reports`,
      );
      return successCount;
    } catch (error) {
      console.error("❌ Error sending driver monthly reports:", error);
      return 0;
    }
  }

  // Send all monthly reports
  async sendAllMonthlyReports(
    month?: string,
    year?: number,
  ): Promise<{
    vendorReportsSent: number;
    driverReportsSent: number;
  }> {
    const currentDate = new Date();
    const reportMonth =
      month ||
      new Intl.DateTimeFormat("en-US", { month: "long" }).format(currentDate);
    const reportYear = year || currentDate.getFullYear();

    console.log(
      `📈 Starting monthly report generation for ${reportMonth} ${reportYear}`,
    );

    const [vendorReportsSent, driverReportsSent] = await Promise.all([
      this.sendVendorMonthlyReports(reportMonth, reportYear),
      this.sendDriverMonthlyReports(reportMonth, reportYear),
    ]);

    // Store report generation log
    const reportLog = {
      id: Date.now().toString(),
      month: reportMonth,
      year: reportYear,
      vendorReportsSent,
      driverReportsSent,
      generatedAt: new Date().toISOString(),
    };

    try {
      const existingLogs = await AsyncStorage.getItem("monthly_report_log");
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(reportLog);
      await AsyncStorage.setItem("monthly_report_log", JSON.stringify(logs));
    } catch (error) {
      console.error("Error saving report log:", error);
    }

    console.log(
      `📊 Monthly reports completed: ${vendorReportsSent} vendors, ${driverReportsSent} drivers`,
    );

    return {
      vendorReportsSent,
      driverReportsSent,
    };
  }

  // Get report generation history
  async getReportHistory(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem("monthly_report_log");
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error("Error getting report history:", error);
      return [];
    }
  }

  // Schedule monthly reports (for testing)
  async scheduleMonthlyReports(): Promise<void> {
    console.log("🗓️ Scheduling monthly reports...");

    // In a real app, you'd use a proper job scheduler or cron job
    // For demo purposes, we'll just trigger it immediately
    setTimeout(async () => {
      await this.sendAllMonthlyReports();
    }, 5000); // Send after 5 seconds for demo

    console.log("✅ Monthly reports scheduled");
  }
}

export default MonthlyReportService.getInstance();
