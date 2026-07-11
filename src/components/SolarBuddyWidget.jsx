import { useState, useEffect, useRef } from 'react';
import { establishGeminiConnection } from '../services/gemini.js';
import SolarDecisionTree from './SolarDecisionTree';
import RangeSlider from './RangeSlider.jsx';
import styles from './SolarBuddyWidget.module.css';
import sunIcon from '../assets/sun-icon.svg';


export default function SalesBuddyWidget({ industry, companyName }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const [treeActive, setTreeActive] = useState(true);

  const messagesEndRef = useRef(null);

 // Initialize the Decision Tree Engine hook-style
  const tree = SolarDecisionTree({
    onStepComplete: (userResponse, nextAiText) => {
      // Push the user's answer AND the next question onto the screen
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: userResponse },
        { role: 'ai', text: nextAiText }
      ]);
    },
    onTreeComplete: (finalData) => {
      setLeadData(finalData);
      setTreeActive(false); // Turn off decision tree, hand keys to Gemini
      
      // POST TO BACKEND TRIGGER
      console.log("🚀 Sending this data packet to the backend database:", finalData);
      if (!finalData.isWesternColorado) {
        console.log("⚠️ Flagged: Address falls into separate out-of-area bucket.");
      }
    }
  });

  // Inject the very first question when the component mounts
  useEffect(() => {
    if (messages.length === 0 && tree.currentStep) {
      setMessages([{ role: 'ai', text: tree.currentStep.text }]);
    }
  }, [tree.currentStep, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (explicitText) => {
    const text = explicitText || prompt;
    if (!text.trim()) return;

    if (treeActive) {
      // Let the decision tree process the response text
      tree.handleAnswer(text);
      setPrompt('');
    } else {
      // Tree is done! Standard Gemini fallback route
      setMessages((prev) => [...prev, { role: 'user', text: text }]);
      setPrompt('');
      setLoading(true);

      const tempId = Date.now();
      setMessages((prev) => [...prev, { id: tempId, role: 'ai', text: 'Thinking...' }]);

      const aiText = await establishGeminiConnection(text);

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempId);
        return [...filtered, { role: 'ai', text: aiText }];
      });
      setLoading(false);
    }
  };
  
  const currentOptions = tree.currentStep?.options || [];
  const isTextInputMode = tree.currentStep?.type === 'text' || !treeActive;
  const isRangeMode = treeActive && tree.currentStep?.type === 'range';

  return (
    <div className={styles.widgetContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <img src={sunIcon} alt="Sun" className={styles.headerIcon} />
          <h1>{companyName}</h1>
        </div>
        <div className={styles.headerActions}>
          <span>Online (Active now)</span>
        </div>
      </div>
      {/* Message Feed */}
      <div className={styles.messageFeed}>
        {messages.map((msg, index) => (
          <div key={msg.id || index} className={`${styles.messageBubble} ${styles[msg.role]}`}>
            {msg.role === 'ai' && <img src={sunIcon} alt="Solar Buddy" className={styles.aiAvatar} />}
            <p className={styles.messageText}>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Range Slider */}
        {isRangeMode && (
          <RangeSlider 
          label="Seriousness Rating"
          min={1}
          max={10}
          initialValue={5}
          onSubmit={(val) => handleSend(val)}
        />
      )}
      {/* Quick Replies / Option Buttons */}
      {!loading && currentOptions.length > 0 && !isRangeMode &&(
        <div className={styles.quickReplyContainer}>
          {currentOptions.map((option, index) => (
            <button key={index} className={styles.quickReplyButton} onClick={() => handleSend(option)}>
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Area */}
      <div className={styles.inputArea}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={treeActive && !isTextInputMode ? "Select an option above..." : `Ask about ${industry}...`}
          disabled={treeActive && !isTextInputMode} // Lock input if they must click a button
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className={styles.textInput}
        />
        <button onClick={() => handleSend()} disabled={loading || (treeActive && !isTextInputMode)} className={styles.sendButton}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}