const crypto = require('crypto');

// Mock Carfax integration
// In production, this would integrate with actual Carfax API

// @desc    Get Carfax report pricing
// @route   GET /api/carfax/price
// @access  Public
const getCarfaxPrice = async (req, res, next) => {
  try {
    const pricing = {
      regularPrice: 39.99,
      discountedPrice: 29.99,
      discount: 25,
      discountReason: 'CarBuyGuru Partner Discount',
      currency: 'USD',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    res.json({
      success: true,
      data: pricing
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Request Carfax report for VIN
// @route   POST /api/carfax/request
// @access  Public
const requestCarfaxReport = async (req, res, next) => {
  try {
    const { vin, evaluationId } = req.body;

    if (!vin || vin.length !== 17) {
      return res.status(400).json({
        success: false,
        error: 'Valid 17-character VIN is required'
      });
    }

    // Mock Carfax report data
    const reportId = crypto.randomUUID();
    
    // Simulate different scenarios based on VIN
    const vinHash = crypto.createHash('md5').update(vin).digest('hex');
    const scenario = parseInt(vinHash.substring(0, 1), 16) % 4;

    let mockReport = {
      reportId,
      vin,
      requestedAt: new Date().toISOString(),
      status: 'completed',
      data: {
        titleInfo: {
          status: 'Clean',
          issues: []
        },
        ownershipHistory: {
          numberOfOwners: 1,
          ownershipType: ['Personal', 'Lease', 'Fleet'][Math.floor(Math.random() * 3)],
          registrationStates: ['CA', 'TX', 'FL'][Math.floor(Math.random() * 3)]
        },
        accidentHistory: {
          reportedAccidents: 0,
          damageReported: false,
          airbagDeployment: false
        },
        serviceHistory: {
          serviceRecords: Math.floor(Math.random() * 15) + 5,
          lastServiceDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          oilChangeRecords: Math.floor(Math.random() * 10) + 8
        },
        recalls: {
          totalRecalls: Math.floor(Math.random() * 3),
          openRecalls: Math.floor(Math.random() * 2),
          recallDetails: []
        },
        mileageHistory: [
          { date: '2020-01-15', mileage: 15000, source: 'Service Record' },
          { date: '2021-03-22', mileage: 28000, source: 'Registration' },
          { date: '2022-06-10', mileage: 42000, source: 'Service Record' }
        ]
      }
    };

    // Adjust data based on scenario
    switch (scenario) {
      case 1: // Accident history
        mockReport.data.accidentHistory = {
          reportedAccidents: 1,
          damageReported: true,
          airbagDeployment: false,
          accidentDetails: [{
            date: '2021-08-15',
            severity: 'Minor',
            damageLocation: 'Front End',
            estimate: '$3,200'
          }]
        };
        break;
      case 2: // Multiple owners
        mockReport.data.ownershipHistory.numberOfOwners = 3;
        break;
      case 3: // Title issues
        mockReport.data.titleInfo = {
          status: 'Rebuilt',
          issues: ['Previously declared total loss', 'Rebuilt after damage']
        };
        break;
      default: // Clean record
        break;
    }

    // Generate summary
    const summary = {
      overallRating: scenario === 0 ? 'Excellent' : scenario === 3 ? 'Poor' : 'Good',
      keyFindings: [],
      redFlags: [],
      recommendations: []
    };

    if (mockReport.data.accidentHistory.reportedAccidents > 0) {
      summary.keyFindings.push('Accident history reported');
      summary.redFlags.push('Previous accident damage');
    }

    if (mockReport.data.ownershipHistory.numberOfOwners > 2) {
      summary.keyFindings.push('Multiple previous owners');
    }

    if (mockReport.data.titleInfo.status !== 'Clean') {
      summary.redFlags.push('Title issues present');
      summary.recommendations.push('Consider impact on resale value');
    }

    if (summary.redFlags.length === 0) {
      summary.recommendations.push('Clean history - good purchase candidate');
    }

    mockReport.summary = summary;

    res.json({
      success: true,
      data: mockReport
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCarfaxPrice,
  requestCarfaxReport
};
