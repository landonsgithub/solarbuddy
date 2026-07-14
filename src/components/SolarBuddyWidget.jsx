import { useEffect, useRef, useState } from 'react';
import SolarDecisionTree from './SolarDecisionTree.jsx';
import RangeSlider from './RangeSlider.jsx';
import styles from './SolarBuddyWidget.module.css';
import sunIcon from '../assets/sun-icon.svg';
import { createLead } from '../services/api.js';
import { sbStore } from '../services/sbStore.js';

function buildLeadPayload(finalData) {
  return {
    fullName: finalData.fullName,
    email: finalData.email,
    propertyType: finalData.propertyType || undefined,
    monthlyBill: finalData.monthlyBill || undefined,
    addressRaw: finalData.addressRaw,
    city: undefined,
    zipCode: finalData.zipCode,
    serviceType: finalData.serviceType || undefined,
    houseSpecs: finalData.houseSpecs || undefined,
    seriousness: finalData.seriousness,
    energyProvider: finalData.energyProvider || undefined,
    consentGiven: finalData.consentGiven,
    consentText: finalData.consentText,
    notes: undefined
  };
}

export default function SolarBuddyWidget({ industry, companyName }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeActive, setTreeActive] = useState(true);
  const [submissionState, setSubmissionState] = useState('idle');
  const messagesEndRef = useRef(null);

  const tree = SolarDecisionTree({
    onStepComplete: (userResponse, nextAiText) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: userResponse },
        { role: 'ai', text: nextAiText }
      ]);
    },
    onTreeComplete: async (finalData) => {
      setTreeActive(false);

      if (finalData.status !== 'completed') {
        setSubmissionState('idle');
        return;
      }

      setLoading(true);
      setSubmissionState('submitting');

      try {
        const response = await createLead(buildLeadPayload(finalData));
        const storedLead = response.data;

        setSubmissionState('success');
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: storedLead.isHotLead
              ? 'Hot lead captured. The backend stored it and triggered the email path.'
              : 'Lead captured successfully. It is now visible in the dashboard.'
          }
        ]);

        window.dispatchEvent(new CustomEvent('solarbuddy:lead-created'));
        sbStore.resetData();
      } catch (error) {
        setSubmissionState('error');
        setTreeActive(true);
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `I could not send the lead to the backend yet: ${error.message}`
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    if (messages.length === 0 && tree.currentStep) {
      setMessages([{ role: 'ai', text: tree.currentStep.text }]);
    }
  }, [tree.currentStep, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (explicitText) => {
    const text = explicitText || prompt;

    if (!text.trim() || loading) {
      return;
    }

    if (treeActive) {
      tree.handleAnswer(text);
      setPrompt('');
    }
  };

  const currentOptions = tree.currentStep?.options || [];
  const isTextInputMode = tree.currentStep?.type === 'text';
  const isRangeMode = treeActive && tree.currentStep?.type === 'range';

  return (
    <section className={styles.widgetContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <img src={sunIcon} alt="Sun" className={styles.headerIcon} />
          <div>
            <h1>{companyName}</h1>
            <p>Demo qualification widget</p>
          </div>
        </div>
      </div>

      <div className={styles.messageFeed}>
        {messages.map((msg, index) => (
          <div key={msg.id || index} className={`${styles.messageBubble} ${styles[msg.role]}`}>
            {msg.role === 'ai' && <img src={sunIcon} alt="Solar Buddy" className={styles.aiAvatar} />}
            <p className={styles.messageText}>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isRangeMode && (
        <RangeSlider
          label="Seriousness Rating"
          min={1}
          max={10}
          initialValue={7}
          onSubmit={(value) => handleSend(value)}
        />
      )}

      {!loading && currentOptions.length > 0 && !isRangeMode && treeActive && (
        <div className={styles.quickReplyContainer}>
          {currentOptions.map((option) => (
            <button key={option} className={styles.quickReplyButton} onClick={() => handleSend(option)}>
              {option}
            </button>
          ))}
        </div>
      )}

      <div className={styles.statusBar}>
        <span>{submissionState === 'submitting' ? 'Sending lead to backend...' : `Flow: ${industry}`}</span>
        {submissionState === 'success' && <strong>Stored</strong>}
        {submissionState === 'error' && <strong>Retry Needed</strong>}
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={treeActive && !isTextInputMode ? 'Select an option above...' : 'Type your answer here...'}
          disabled={!treeActive || (treeActive && !isTextInputMode) || loading}
          onKeyDown={(event) => event.key === 'Enter' && handleSend()}
          className={styles.textInput}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !treeActive || (treeActive && !isTextInputMode)}
          className={styles.sendButton}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </section>
  );
}
