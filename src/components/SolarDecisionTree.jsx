import { useState } from 'react';
import { sbStore } from '../services/sbStore';

const STEPS = {
  start: {
    id: 'start',
    text: "Hi there! Are you interested in exploring solar options for your property today?",
    options: ["Yes", "No"],
    next: (ans) => ans === "Yes" ? 'property_type' : 'end_not_interested'
  },
  property_type: {
    id: 'property_type',
    text: "Awesome! Is this for a commercial business or a private residence?",
    options: ["Private Residence", "Commercial Business"],
    next: (ans) => ans === "Private Residence" ? 'monthly_bill' : 'address'
  },
   monthly_bill: {
    id: 'monthly_bill',
    text: "How much is your average monthly electric bill, roughly?",
    options: ["Less than $250", "$250 - $500", "$500 - $1000", "$1000+"],
    next: () => 'address'
  },
  address: {
    id: 'address',
    text: "Got it. What is the full address of the property?",
    type: 'text', 
    next: () => 'service_type'
  },
  service_type: {
    id: 'service_type',
    text: "Perfect. What kind of project are we looking at?",
    options: ["Full Installation", "Panel Replacement", "Different Solar Need"],
    next: (ans) => ans === "Full Installation" ? 'house_specs' : 'seriousness_scale'
  },
  house_specs: {
    id: 'house_specs',
    text: "For a full install, what is the approximate square footage of your home and the size of your roof? (If you aren't sure about the roof, just type or select N/A)",
    type: 'text',
    options: ["N/A"], 
    next: () => 'seriousness_scale'
  },
  seriousness_scale: {
    id: 'seriousness_scale',
    text: "Rate your solar readiness from 1 (just daydreaming) to 10 (ready to install tomorrow)!",
    type: 'range', 
    min: 1,
    max: 10,
    next: () => 'energy_provider'
  },
   energy_provider: {
    id: 'energy_provider',
    text: "What is the name of your current energy provider?",
    type: 'text', 
    next: () => 'email_address',
  },
  email_address:{
    id: 'email_address',
    text: "Can you please provide your email address?",
    type: 'text', 
    next: () => 'qualified_complete' 
  },
};


// const [currentStepId, setCurrentStepId] = useState('start');

export default function SolarDecisionTree({ onStepComplete, onTreeComplete }) {
  const [currentStepId, setCurrentStepId] = useState('start');
  
  // Added monthlyBill and energyProvider to your initial state
  const [formData, setFormData] = useState({
    propertyType: '',
    monthlyBill: '',
    address: '',
    isWesternColorado: true, 
    serviceType: '',
    houseSpecs: '',
    seriousness: 5,
    energyProvider: '',
    emailAddress :'' 
  });

  const currentStep = STEPS[currentStepId];

  const handleAnswer = (answerText) => {
    //Front end data log
   sbStore.updateItem(currentStepId, answerText);

    let updatedFormData = { ...formData };
    
    // data capture
    if (currentStepId === 'property_type') updatedFormData.propertyType = answerText;
    if (currentStepId === 'monthly_bill') updatedFormData.monthlyBill = answerText;
    if (currentStepId === 'address') {
      updatedFormData.address = answerText;
      const isWestCO = answerText.toLowerCase().includes('co') || answerText.toLowerCase().includes('colorado');
      updatedFormData.isWesternColorado = isWestCO; 
    }
    if (currentStepId === 'service_type') updatedFormData.serviceType = answerText;
    if (currentStepId === 'house_specs') updatedFormData.houseSpecs = answerText;
    if (currentStepId === 'seriousness_scale') {
      updatedFormData.seriousness = parseInt(answerText, 10);
    }
    if (currentStepId === 'energy_provider') updatedFormData.energyProvider = answerText;
    if (currentStepId === 'email_address') updatedFormData.emailAddress = answerText;

    setFormData(updatedFormData);

    const nextStepId = currentStep.next(answerText);
    let nextAiText = "";

    if (nextStepId === 'end_not_interested') {
      nextAiText = "No worries at all! Let me know if you change your mind. Have a great day!";
      onTreeComplete(updatedFormData);
    } else if (nextStepId === 'qualified_complete') { 
      nextAiText = "Thank you! I've logged all your project details safely. Now, feel free to ask me any specific questions you have about solar panels, costs, or timelines!";
      onTreeComplete(updatedFormData);
    } else {
      nextAiText = STEPS[nextStepId].text;
      setCurrentStepId(nextStepId);
    }

    const displayResponse = currentStepId === 'seriousness_scale' ? `${answerText} / 10` : answerText;
    onStepComplete(displayResponse, nextAiText);
  };

  return {
    currentStep,
    handleAnswer
  };
}