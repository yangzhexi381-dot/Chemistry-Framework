/* Reversible thermodynamics contract only. Kinetics, transport and SOC are unimplemented. */
(function(global){
  'use strict';
  global.CFModels=global.CFModels||{};
  const R=8.31446261815324,F=96485.33212;
  function reversible({temperatureK,electrons,standardEmfV,reactionQuotient}){
    if(!Number.isFinite(temperatureK)||temperatureK<=0||!Number.isInteger(electrons)||electrons<=0||!Number.isFinite(standardEmfV)||!Number.isFinite(reactionQuotient)||reactionQuotient<=0){
      throw new RangeError('Require T>0 K, positive integer electron count, finite E° V and positive dimensionless Q');
    }
    const emfV=standardEmfV-R*temperatureK/(electrons*F)*Math.log(reactionQuotient);
    const deltaGJMol=-electrons*F*emfV;
    if(!Number.isFinite(emfV)||!Number.isFinite(deltaGJMol))throw new RangeError('Unsupported numerical scale');
    return {emfV,deltaGJMol,assumptions:['specified overall reaction and activity-based Q','reversible isothermal cell','no polarization or ohmic losses']};
  }
  global.CFModels.electrochemicalCell={R,F,reversible};
})(window);
