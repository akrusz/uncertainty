function univariate(params){
	// Expected value / mean of the distribution
	this.mean = undefined,
	// Width of this distribution's standard deviation
	this.standardDeviation = undefined,
	// Where the significant region begins on the x-axis.
	this.startX = undefined,
	// Where the significant region ends on the x-axis.
	this.endX = undefined,
	// Width in SDs of the region we consider to be significant
	this.widthInSDs = function(){
		return (this.endX - this.startX) / this.standardDeviation;
	}
	// Probability density function / measure. Must be overridden.
	this.value = function(x){
		return undefined;
	}
	// The function's integral, which must be set to a new univariate.
	this.antiderivative = undefined;
	
	// Ideally we generate a new probability distribution with each data
	// point, but for now let's just use distros that either only translate
	// or scale with the mean. This will let us use a single gradient for
	// all data points.
	// Does the distribution translate in step with the mean?
	this.translatesWithMean = false;
	// Does the distribution start at 0 and expand with the mean?
	this.scalesWithMean = false;
}

// Each distro must have either mean = 1 (if scalesWithMean)
// or mean = 0 (if translatesWithMean).
function normalDistribution(){
	// Standard normal distro
	this.mean = 0;
	this.standardDeviation = 1;
	this.translatesWithMean = true;
	
	// Probability density function / measure.
	this.startX = -3.33;
	this.endX = 3.33;
	this.value = function(x){
		return Math.exp(-x * x / 2)/ Math.sqrt(2 * Math.PI);
	};
	
	this.antiderivative = new normalDistroIntegral();
}
normalDistribution.prototype = new univariate();

function normalDistroIntegral(){
	this.translatesWithMean = true;
	
	// Width in SDs of the region we consider to be significant
	this.widthInSDs = function(){
		return (this.endX - this.startX);
	}
	
	// This function does not have a mean or SD.
	this.startX = -2.66;
	this.endX = 2.66;
	this.value = function(x){
		return 0.5*(1 + erf(x / Math.sqrt(2)));
	};
}
normalDistroIntegral.prototype = new univariate();

function hypSecDistribution(){
	// Hyperbolic secant distro
	this.mean = 0;
	this.standardDeviation = 1;
	this.translatesWithMean = true;
	
	// Probability density function / measure.
	this.startX = -3.51;
	this.endX = 3.51;
	this.value = function(x){
		return 0.5 * sech(Math.PI/2 * x);
	};
	
	this.antiderivative = new hypSecDistroIntegral();
}
hypSecDistribution.prototype = new univariate();

function hypSecDistroIntegral(){
	this.translatesWithMean = true;
	
	// Width in SDs of the region we consider to be significant
	this.widthInSDs = function(){
		return (this.endX - this.startX);
	}
	
	// This function does not have a mean or SD.
	this.startX = -3.22;
	this.endX = 3.22;
	this.value = function(x){
		return 2/Math.PI * Math.atan(Math.exp(Math.PI/2 * x));
	};
}
hypSecDistroIntegral.prototype = new univariate();

function uniformDistribution(){
	// Standard uniform distro
	this.mean = 0;
	this.standardDeviation = 1 / (2 * Math.sqrt(3));
	this.translatesWithMean = true;
	
	// Probability density function / measure.
	this.startX = -.5;
	this.endX = .5;
	this.value = function(x){
		return (x < -.5 || x > .5)
			? 0
			: 1;
	};
	
	this.antiderivative = new uniformDistroIntegral();
}
uniformDistribution.prototype = new univariate();

function uniformDistroIntegral(){
	this.translatesWithMean = true;
	
	// Width in SDs of the region we consider to be significant
	this.widthInSDs = function(){
		return (this.endX - this.startX)*(2 * Math.sqrt(3));
	}
	
	// This function does not have a mean or SD.
	this.startX = -.5;
	this.endX = .5;
	this.value = function(x){
		if(x < -.5){
			return 0;
		}
		else if(x < .5){
			return x + .5;
		}
		else{
			return 1;
		}
	};
}
uniformDistroIntegral.prototype = new univariate();

// Triangular distribution
function triangularDistribution(peak){
	if(peak < 0 || peak > 1){
		peak = 0.5;
	}
	// Triangular distro with peak at "peak"
	this.mean = (1 + peak)/3;
	this.standardDeviation = Math.sqrt((1 + peak*peak - peak)/18);
	this.translatesWithMean = true;
	
	// Probability density function / measure.
	this.startX = 0;
	this.endX = 1;
	this.value = function(x){
		return x < peak
			? (2*x) / peak
			: 2*(1 - x)/(1 - peak);
	};
	
	this.antiderivative = new triangularDistroIntegral(peak);
}
triangularDistribution.prototype = new univariate();

function triangularDistroIntegral(peak){
	this.translatesWithMean = true;
	
	// Width in SDs of the region we consider to be significant
	this.widthInSDs = function(){
		return 1 / Math.sqrt((1 + peak*peak - peak)/18);
	}
	
	// This function does not have a mean or SD.
	this.startX = 0;
	this.endX = 1;
	this.value = function(x){
		return x < peak
			? (x*x)/peak
			: 1 - (1 - x)*(1 - x)/(1 - peak);
	};
}
triangularDistroIntegral.prototype = new univariate();

function exponentialDistribution(){
	// We're passing in the standard deviation / mean.
	// It'd be nicer theoretically to pass in lambda, but this is more consistent.
	this.mean = 1;
	this.standardDeviation = 1;
	this.scalesWithMean = true;
					
	// Probability density function / measure.
	this.startX = 0;
	this.endX = 5;
	this.value = function(x){
		return Math.exp(-x);
	};
	
	this.antiderivative = new exponentialDistroIntegral();
}
exponentialDistribution.prototype = new univariate();

function exponentialDistroIntegral(){
	// We're passing in the standard deviation / mean.
	// It'd be nicer theoretically to pass in lambda, but this is more consistent.
	this.scalesWithMean = true;
	this.widthInSDs = function(){
		return (this.endX - this.startX);
	}
	
	// Probability density function / measure.
	this.startX = 0;
	this.endX = 5;
	this.value = function(x){
		return 1 - Math.exp(-x);
	};
}
exponentialDistroIntegral.prototype = new univariate();