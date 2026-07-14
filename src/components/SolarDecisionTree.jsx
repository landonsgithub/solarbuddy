import { useState } from 'react';
import { sbStore } from '../services/sbStore.js';

const CONSENT_COPY = 'I consent to the storage of my information for lead follow-up.';

const STEPS = {
  start: {
    id: 'start',
    text: 'Hi there! Are you interested in exploring solar options for your property today?',
    options: ['Yes', 'No'],
    next: (answer) => (answer === 'Yes' ? 'full_name' : 'end_not_interested')
  },
  full_name: {
    id: 'full_name',
    text: 'Great. What is your full name?',
    type: 'text',
    next: () => 'property_type'
  },
  property_type: {
    id: 'property_type',
    text: 'Awesome! Is this for a commercial business or a private residence?',
    options: ['Private Residence', 'Commercial Business'],
    next: (answer) => (answer === 'Private Residence' ? 'monthly_bill' : 'zip_code')
  },
  monthly_bill: {
    id: 'monthly_bill',
    text: 'How much is your average monthly electric bill, roughly?',
    options: ['Less than $250', '$250 - $500', '$500 - $1000', '$1000+'],
    next: () => 'zip_code'
  },
  zip_code: {
    id: 'zip_code',
    text: 'What is the property ZIP code?',
    type: 'text',
    next: () => 'address'
  },
  address: {
    id: 'address',
    text: 'What is the full property address? You can also skip this step.',
    type: 'text',
    options: ['Skip'],
    next: () => 'service_type'
  },
  service_type: {
    id: 'service_type',
    text: 'Perfect. What kind of project are we looking at?',
    options: ['Full Installation', 'Panel Replacement', 'Different Solar Need'],
    next: (answer) => (answer === 'Full Installation' ? 'house_specs' : 'seriousness_scale')
  },
  house_specs: {
    id: 'house_specs',
    text: "For a full install, what is the approximate square footage of your home and the size of your roof? If you aren't sure, you can type N/A.",
    type: 'text',
    options: ['N/A'],
    next: () => 'seriousness_scale'
  },
  seriousness_scale: {
    id: 'seriousness_scale',
    text: 'Rate your solar readiness from 1 to 10.',
    type: 'range',
    min: 1,
    max: 10,
    next: () => 'energy_provider'
  },
  energy_provider: {
    id: 'energy_provider',
    text: 'What is the name of your current energy provider?',
    type: 'text',
    next: () => 'email_address'
  },
  email_address: {
    id: 'email_address',
    text: 'What is the best email address to reach you?',
    type: 'text',
    next: () => 'phone_number'
  },
  phone_number: {
    id: 'phone_number',
    text: 'What is the best cell phone number to reach you?',
    type: 'text',
    next: () => 'consent_storage'
  },
  consent_storage: {
    id: 'consent_storage',
    text: 'Do you consent to us storing your information for lead follow-up?',
    options: ['I Consent', 'No'],
    next: (answer) => (answer === 'I Consent' ? 'qualified_complete' : 'end_no_consent')
  }
};

const INITIAL_DATA = {
  fullName: '',
  propertyType: '',
  monthlyBill: '',
  addressRaw: '',
  zipCode: '',
  serviceType: '',
  houseSpecs: '',
  seriousness: 5,
  energyProvider: '',
  email: '',
  phone: '',
  consentGiven: false,
  consentText: ''
};

export default function SolarDecisionTree({ onStepComplete, onTreeComplete }) {
  const [currentStepId, setCurrentStepId] = useState('start');
  const [formData, setFormData] = useState(INITIAL_DATA);

  const currentStep = STEPS[currentStepId];

  const handleAnswer = (answerText) => {
    sbStore.updateItem(currentStepId, answerText);

    const updatedFormData = { ...formData };

    if (currentStepId === 'full_name') updatedFormData.fullName = answerText;
    if (currentStepId === 'property_type') updatedFormData.propertyType = answerText;
    if (currentStepId === 'monthly_bill') updatedFormData.monthlyBill = answerText;
    if (currentStepId === 'zip_code') updatedFormData.zipCode = answerText;
    if (currentStepId === 'address') {
      updatedFormData.addressRaw = answerText === 'Skip' ? 'N/A' : answerText;
    }
    if (currentStepId === 'service_type') updatedFormData.serviceType = answerText;
    if (currentStepId === 'house_specs') updatedFormData.houseSpecs = answerText;
    if (currentStepId === 'seriousness_scale') updatedFormData.seriousness = parseInt(answerText, 10);
    if (currentStepId === 'energy_provider') updatedFormData.energyProvider = answerText;
    if (currentStepId === 'email_address') updatedFormData.email = answerText;
    if (currentStepId === 'phone_number') updatedFormData.phone = answerText;
    if (currentStepId === 'consent_storage') {
      updatedFormData.consentGiven = answerText === 'I Consent';
      updatedFormData.consentText = answerText === 'I Consent' ? CONSENT_COPY : '';
    }

    setFormData(updatedFormData);

    const nextStepId = currentStep.next(answerText);
    let nextAiText = '';

    if (nextStepId === 'end_not_interested') {
      nextAiText = 'No worries at all. If solar becomes relevant later, we are here to help.';
      onTreeComplete({ ...updatedFormData, status: 'not_interested' });
    } else if (nextStepId === 'end_no_consent') {
      nextAiText = 'Understood. We cannot store your information without consent, so the demo stops here.';
      onTreeComplete({ ...updatedFormData, status: 'no_consent' });
    } else if (nextStepId === 'qualified_complete') {
      nextAiText = 'Thank you for contacting Solar Buddy. We have received your information and our team will reach out to you soon.';
      onTreeComplete({ ...updatedFormData, status: 'completed' });
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
