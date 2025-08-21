// Mock car data and market information
const carMakes = ['Honda', 'Toyota', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Chevrolet', 'Nissan'];
const carModels = {
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
const searchCars = async (req, res, next) => {
  try {
    const { q, make, year } = req.query;

    let results = [];

    if (q) {
      // Search by query string
      const query = q.toLowerCase();
      
      Object.entries(carModels).forEach(([carMake, models]) => {
        if (carMake.toLowerCase().includes(query)) {
          models.forEach(model => {
            results.push({ make: carMake, model });
          });
        } else {
          models.forEach(model => {
            if (model.toLowerCase().includes(query)) {
              results.push({ make: carMake, model });
            }
          });
        }
      });
    } else if (make) {
      // Search by specific make
      const models = carModels[make] || [];
      results = models.map(model => ({ make, model }));
    } else {
      // Return all makes
      results = carMakes.map(make => ({ make, models: carModels[make] }));
    }

    res.json({
      success: true,
      count: results.length,
      data: results.slice(0, 20) // Limit results
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed car information
// @route   GET /api/cars/info/:year/:make/:model
// @access  Public
const getCarInfo = async (req, res, next) => {
  try {
    const { year, make, model } = req.params;

    // Mock car information
    const carInfo = {
      year: parseInt(year),
      make,
      model,
      bodyStyle: ['Sedan', 'SUV', 'Hatchback'][Math.floor(Math.random() * 3)],
      engine: ['2.0L 4-Cylinder', '3.5L V6', '2.4L 4-Cylinder'][Math.floor(Math.random() * 3)],
      transmission: ['Automatic', 'Manual', 'CVT'][Math.floor(Math.random() * 3)],
      fuelEconomy: {
        city: Math.floor(Math.random() * 10) + 20,
        highway: Math.floor(Math.random() * 15) + 25
      },
      commonIssues: [
        'Brake pad wear',
        'Air conditioning compressor',
        'Transmission fluid service'
      ],
      recalls: Math.floor(Math.random() * 3),
      reliability: ['Excellent', 'Good', 'Average', 'Below Average'][Math.floor(Math.random() * 4)],
      depreciation: Math.floor(Math.random() * 20) + 40 // 40-60%
    };

    res.json({
      success: true,
      data: carInfo
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get market pricing data
// @route   GET /api/cars/market-data
// @access  Public
const getMarketData = async (req, res, next) => {
  try {
    const { year, make, model, mileage, zipCode } = req.query;

    if (!year || !make || !model) {
      return res.status(400).json({
        success: false,
        error: 'Year, make, and model are required'
      });
    }

    // Mock market data calculation
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - parseInt(year);
    const baseMSRP = Math.floor(Math.random() * 30000) + 20000; // $20k-50k
    
    // Depreciation calculation (rough)
    let currentValue = baseMSRP;
    for (let i = 0; i < carAge; i++) {
      currentValue *= 0.85; // 15% depreciation per year (simplified)
    }

    // Mileage adjustment
    if (mileage) {
      const expectedMileage = carAge * 12000;
      const mileageDifference = parseInt(mileage) - expectedMileage;
      const mileageAdjustment = mileageDifference * 0.1; // $0.10 per mile difference
      currentValue -= mileageAdjustment;
    }

    currentValue = Math.max(currentValue, baseMSRP * 0.2); // Minimum 20% of MSRP

    const marketData = {
      estimatedValue: Math.round(currentValue),
      priceRange: {
        low: Math.round(currentValue * 0.85),
        high: Math.round(currentValue * 1.15)
      },
      dealerAverage: Math.round(currentValue * 1.1),
      privateSellerAverage: Math.round(currentValue * 0.95),
      tradeInValue: Math.round(currentValue * 0.8),
      dataSource: 'CarBuyGuru Market Analysis',
      lastUpdated: new Date().toISOString(),
      comparable: [
        {
          source: 'AutoTrader',
          count: Math.floor(Math.random() * 20) + 5,
          avgPrice: Math.round(currentValue * (0.9 + Math.random() * 0.2)),
          avgMileage: Math.floor(Math.random() * 20000) + 30000
        },
        {
          source: 'Cars.com',
          count: Math.floor(Math.random() * 15) + 3,
          avgPrice: Math.round(currentValue * (0.95 + Math.random() * 0.15)),
          avgMileage: Math.floor(Math.random() * 25000) + 25000
        }
      ]
    };

    res.json({
      success: true,
      data: marketData
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchCars,
  getCarInfo,
  getMarketData
};
