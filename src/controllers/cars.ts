import { Request, Response, NextFunction } from 'express';
import { IAuthRequest, ApiResponse } from '../types';

// Mock car data and market information
const carMakes = ['Honda', 'Toyota', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Chevrolet', 'Nissan'];

interface CarModels {
  [key: string]: string[];
}

const carModels: CarModels = {
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot'],
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  Mercedes: ['C-Class', 'E-Class', 'GLC', 'GLE'],
  Audi: ['A4', 'A6', 'Q5', 'Q7'],
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang'],
  Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Suburban'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder']
};

// @desc    Search for cars by make/model/year
// @route   GET /api/cars/search
// @access  Public
export const searchCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, make, year } = req.query;
    let results: any[] = [];

    if (q && typeof q === 'string') {
      // Search by query string
      const query = q.toLowerCase();
      
      if (query.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        } as ApiResponse);
        return;
      }

      // Search in makes
      const matchingMakes = carMakes.filter(carMake => 
        carMake.toLowerCase().includes(query)
      );

      results = matchingMakes.map(carMake => ({ 
        type: 'make', 
        make: carMake, 
        models: carModels[carMake] 
      }));

      // Search in models
      for (const [carMake, models] of Object.entries(carModels)) {
        const matchingModels = models.filter((model: string) => 
          model.toLowerCase().includes(query)
        );
        
        matchingModels.forEach((model: string) => {
          results.push({ 
            type: 'model', 
            make: carMake, 
            model 
          });
        });
      }

    } else if (make && typeof make === 'string') {
      // Get models for specific make
      const models = carModels[make] || [];
      results = models.map((model: string) => ({ make, model }));
    } else {
      // Return all makes with their models
      results = carMakes.map(carMake => ({ make: carMake, models: carModels[carMake] }));
    }

    res.json({
      success: true,
      message: 'Car search completed',
      data: {
        results,
        total: results.length
      }
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed car information
// @route   GET /api/cars/info/:year/:make/:model
// @access  Public
export const getCarInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, make, model } = req.params;

    // Validate year
    const carYear = parseInt(year as string);
    if (isNaN(carYear) || carYear < 1990 || carYear > new Date().getFullYear() + 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid year provided'
      } as ApiResponse);
      return;
    }

    // Mock car information
    const carInfo = {
      year: carYear,
      make,
      model,
      bodyStyle: 'Sedan', // Mock data
      engine: '2.0L 4-Cylinder',
      transmission: 'CVT Automatic',
      fuelEconomy: {
        city: Math.floor(Math.random() * 10) + 20,
        highway: Math.floor(Math.random() * 15) + 25
      },
      commonIssues: [
        'Transmission issues after 100k miles',
        'AC compressor failure',
        'Brake pad wear'
      ],
      recalls: Math.floor(Math.random() * 3),
      reliability: Math.random() > 0.3 ? 'Good' : 'Average',
      depreciation: Math.floor(Math.random() * 20) + 10 // 10-30%
    };

    res.json({
      success: true,
      message: 'Car information retrieved',
      data: carInfo
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Get market pricing data
// @route   GET /api/cars/market-data
// @access  Public
export const getMarketData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, make, model, mileage, zip } = req.query;

    if (!year || !make || !model || !mileage) {
      res.status(400).json({
        success: false,
        message: 'Year, make, model, and mileage are required'
      } as ApiResponse);
      return;
    }

    const carYear = parseInt(year as string);
    const carMileage = parseInt(mileage as string);

    // Mock market data calculation
    const baseValue = Math.floor(Math.random() * 20000) + 15000;
    const mileageAdjustment = Math.max(0, (150000 - carMileage) / 15000) * 1000;
    const ageAdjustment = Math.max(0, (2024 - carYear)) * -800;
    
    const estimatedValue = Math.round(baseValue + mileageAdjustment + ageAdjustment);
    const priceRange = {
      low: Math.round(estimatedValue * 0.85),
      high: Math.round(estimatedValue * 1.15)
    };

    const marketData = {
      estimatedValue,
      priceRange,
      dealerAverage: Math.round(estimatedValue * 1.1),
      privateSellerAverage: Math.round(estimatedValue * 0.95),
      tradeInValue: Math.round(estimatedValue * 0.8),
      dataSource: 'CarBuyGuru Market Analysis',
      lastUpdated: new Date().toISOString(),
      comparable: [
        {
          source: 'Cars.com',
          count: Math.floor(Math.random() * 50) + 20,
          avgPrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          avgMileage: carMileage + Math.floor((Math.random() - 0.5) * 20000)
        },
        {
          source: 'AutoTrader',
          count: Math.floor(Math.random() * 40) + 15,
          avgPrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          avgMileage: carMileage + Math.floor((Math.random() - 0.5) * 15000)
        },
        {
          source: 'CarGurus',
          count: Math.floor(Math.random() * 35) + 10,
          avgPrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          avgMileage: carMileage + Math.floor((Math.random() - 0.5) * 18000)
        }
      ],
      marketTrend: Math.random() > 0.5 ? 'stable' : (Math.random() > 0.5 ? 'increasing' : 'decreasing'),
      demandLevel: Math.random() > 0.6 ? 'high' : (Math.random() > 0.5 ? 'medium' : 'low')
    };

    res.json({
      success: true,
      message: 'Market data retrieved successfully',
      data: marketData
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};