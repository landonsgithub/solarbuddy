import { useEffect, useRef, useState } from 'react';
import SolarDecisionTree from './SolarDecisionTree.jsx';
import RangeSlider from './RangeSlider.jsx';
import styles from './SolarBuddyWidget.module.css';
import sunIcon from '../assets/sun-icon.svg';
import {
  bookCalendarAppointment,
  createLead,
  fetchCalendarAvailability,
  fetchCalendarBookingDays
} from '../services/api.js';
import { sbStore } from '../services/sbStore.js';

const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Choose another day'];
const SCHEDULE_OPTIONS = ['Yes, let\'s schedule', 'No, not now'];
const EMAIL_CONFIRM_OPTIONS = ['Yes', 'Use a different email'];
const SEE_MORE_OPTION = 'See more times...';
const CHANGE_DAY_OPTION = 'Choose another day';
const SLOT_BATCH_SIZE = 3;
const DENVER_TIMEZONE = 'America/Denver';

function buildLeadPayload(finalData) {
  return {
    fullName: finalData.fullName,
    email: finalData.email,
    phone: finalData.phone || undefined,
    propertyType: finalData.propertyType || undefined,
    monthlyBill: finalData.monthlyBill || undefined,
    addressRaw: finalData.addressRaw || 'N/A',
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

function getHourInDenver(slot) {
  const formattedHour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: DENVER_TIMEZONE
  }).format(new Date(slot));

  return Number.parseInt(formattedHour, 10);
}

function filterSlotsByTimeOfDay(slots, timeOfDay) {
  return slots.filter((slot) => {
    const hour = getHourInDenver(slot);
    return timeOfDay === 'Morning' ? hour < 12 : hour >= 12;
  });
}

function formatSlotLabel(slot) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: DENVER_TIMEZONE
  }).format(new Date(slot));
}

function buildVisibleSlotOptions(filteredSlots, currentIndex) {
  const currentBatch = filteredSlots.slice(currentIndex, currentIndex + SLOT_BATCH_SIZE);
  const labels = currentBatch.map((slot) => formatSlotLabel(slot));
  const hasMore = currentIndex + SLOT_BATCH_SIZE < filteredSlots.length;

  return {
    labels: hasMore ? [...labels, SEE_MORE_OPTION, CHANGE_DAY_OPTION] : [...labels, CHANGE_DAY_OPTION],
    slotMap: Object.fromEntries(currentBatch.map((slot) => [formatSlotLabel(slot), slot]))
  };
}

function buildBookingPayload(bookingState, leadPayload) {
  return {
    leadId: bookingState.leadId,
    fullName: leadPayload.fullName,
    email: bookingState.confirmedEmail,
    phone: leadPayload.phone,
    zipCode: leadPayload.zipCode,
    addressRaw: leadPayload.addressRaw,
    selectedSlot: bookingState.selectedSlot,
    durationMinutes: 15
  };
}

const INITIAL_BOOKING_STATE = {
  active: false,
  step: 'idle',
  leadId: null,
  fullName: '',
  originalEmail: '',
  confirmedEmail: '',
  leadPayload: null,
  availableSlots: [],
  filteredSlots: [],
  currentIndex: 0,
  currentDayLabel: '',
  currentDayDate: '',
  currentTimeOfDay: '',
  selectedSlot: '',
  slotMap: {},
  dayOptions: [],
  dayMap: {}
};

export default function SolarBuddyWidget({ companyName }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeActive, setTreeActive] = useState(true);
  const [submissionState, setSubmissionState] = useState('idle');
  const [bookingState, setBookingState] = useState(INITIAL_BOOKING_STATE);
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
        const leadPayload = buildLeadPayload(finalData);
        const response = await createLead(leadPayload);
        const storedLead = response.data;

        setSubmissionState('success');
        window.dispatchEvent(new CustomEvent('solarbuddy:lead-created'));

        if (storedLead.isHotLead) {
          setBookingState({
            ...INITIAL_BOOKING_STATE,
            active: true,
            step: 'offer_schedule',
            leadId: storedLead.id,
            fullName: leadPayload.fullName,
            originalEmail: leadPayload.email,
            confirmedEmail: leadPayload.email,
            leadPayload
          });

          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: 'Based on your info, you\'re ready to go! Want to see some times to connect with an expert?'
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: 'Thank you for reaching out to Solar Buddy. We have received your information and will be in touch soon.'
            }
          ]);
          sbStore.resetData();
        }
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

  function appendMessagePair(userText, aiText) {
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText },
      { role: 'ai', text: aiText }
    ]);
  }

  async function handleBookingAction(actionText) {
    switch (bookingState.step) {
      case 'offer_schedule': {
        if (actionText === 'No, not now') {
          appendMessagePair(actionText, 'Thank you for reaching out to Solar Buddy. Our team will contact you soon.');
          sbStore.resetData();
          setBookingState(INITIAL_BOOKING_STATE);
          return;
        }

        setLoading(true);
        setSubmissionState('scheduling');

        try {
          const bookingDaysResponse = await fetchCalendarBookingDays();
          const days = bookingDaysResponse.data?.days ?? [];

          if (days.length === 0) {
            appendMessagePair(actionText, 'I could not find any weekday options right now. Please try again shortly.');
            return;
          }

          appendMessagePair(actionText, 'Great, which day works best for a 15 minute call?');
          setBookingState((prev) => ({
            ...prev,
            step: 'day_picker',
            dayOptions: days.map((day) => day.label),
            dayMap: Object.fromEntries(days.map((day) => [day.label, day.date]))
          }));
        } catch (error) {
          appendMessagePair(actionText, `I could not load the available days yet: ${error.message}`);
        } finally {
          setLoading(false);
          setSubmissionState('success');
        }
        return;
      }

      case 'day_picker': {
        setLoading(true);
        setSubmissionState('scheduling');

        try {
          const selectedDate = bookingState.dayMap[actionText];
          if (!selectedDate) {
            appendMessagePair(actionText, 'I could not match that date option. Please choose again.');
            return;
          }

          const availabilityResponse = await fetchCalendarAvailability(selectedDate);
          const slots = availabilityResponse.data?.slots ?? availabilityResponse.slots ?? [];

          if (slots.length === 0) {
            appendMessagePair(actionText, 'I could not find open times for that option. Please choose another day.');
            setBookingState((prev) => ({
              ...prev,
              availableSlots: [],
              filteredSlots: [],
              currentDayLabel: '',
              currentDayDate: '',
              currentIndex: 0,
              slotMap: {},
              step: 'day_picker'
            }));
            return;
          }

          appendMessagePair(actionText, `Perfect. For ${actionText.toLowerCase()}, do you generally prefer the Morning or Afternoon?`);
          setBookingState((prev) => ({
            ...prev,
            availableSlots: slots,
            filteredSlots: [],
            currentDayLabel: actionText,
            currentDayDate: selectedDate,
            currentIndex: 0,
            currentTimeOfDay: '',
            slotMap: {},
            step: 'time_of_day'
          }));
        } catch (error) {
          appendMessagePair(actionText, `I could not check availability yet: ${error.message}`);
        } finally {
          setLoading(false);
          setSubmissionState('success');
        }
        return;
      }

      case 'time_of_day': {
        if (actionText === CHANGE_DAY_OPTION) {
          appendMessagePair(actionText, 'No problem. Which day would work best instead?');
          setBookingState((prev) => ({
            ...prev,
            step: 'day_picker',
            currentDayLabel: '',
            currentDayDate: '',
            currentTimeOfDay: '',
            filteredSlots: [],
            currentIndex: 0,
            slotMap: {}
          }));
          return;
        }

        const filteredSlots = filterSlotsByTimeOfDay(bookingState.availableSlots, actionText);

        if (filteredSlots.length === 0) {
          appendMessagePair(actionText, `I do not have open ${actionText.toLowerCase()} times there. Please choose another day.`);
          setBookingState((prev) => ({
            ...prev,
            step: 'day_picker',
            currentDayLabel: '',
            currentDayDate: '',
            currentTimeOfDay: '',
            filteredSlots: [],
            currentIndex: 0,
            slotMap: {}
          }));
          return;
        }

        const slotBatch = buildVisibleSlotOptions(filteredSlots, 0);
        appendMessagePair(actionText, 'Alright, which time works best for you?');
        setBookingState((prev) => ({
          ...prev,
          currentTimeOfDay: actionText,
          filteredSlots,
          currentIndex: 0,
          slotMap: slotBatch.slotMap,
          step: 'time_picker'
        }));
        return;
      }

      case 'time_picker': {
        if (actionText === CHANGE_DAY_OPTION) {
          appendMessagePair(actionText, 'Sure. Which day would you like to check instead?');
          setBookingState((prev) => ({
            ...prev,
            step: 'day_picker',
            currentDayLabel: '',
            currentDayDate: '',
            currentTimeOfDay: '',
            filteredSlots: [],
            currentIndex: 0,
            slotMap: {}
          }));
          return;
        }

        if (actionText === SEE_MORE_OPTION) {
          const nextIndex = bookingState.currentIndex + SLOT_BATCH_SIZE;
          const slotBatch = buildVisibleSlotOptions(bookingState.filteredSlots, nextIndex);
          appendMessagePair(actionText, 'Here are more available times.');
          setBookingState((prev) => ({
            ...prev,
            currentIndex: nextIndex,
            slotMap: slotBatch.slotMap
          }));
          return;
        }

        const selectedSlot = bookingState.slotMap[actionText];
        if (!selectedSlot) {
          return;
        }

        appendMessagePair(
          actionText,
          `Perfect, we'll send the invite to ${bookingState.confirmedEmail}. Is that correct?`
        );
        setBookingState((prev) => ({
          ...prev,
          selectedSlot,
          step: 'confirm_email'
        }));
        return;
      }

      case 'confirm_email': {
        if (actionText === 'Use a different email') {
          appendMessagePair(actionText, 'Please type the email address where you want to receive the calendar invite.');
          setBookingState((prev) => ({
            ...prev,
            step: 'change_email'
          }));
          return;
        }

        setLoading(true);
        setSubmissionState('booking');

        try {
          await bookCalendarAppointment(buildBookingPayload(bookingState, bookingState.leadPayload));
          appendMessagePair(actionText, 'Your consultation is booked. We will send the calendar invite to your email shortly.');
          sbStore.resetData();
          setBookingState(INITIAL_BOOKING_STATE);
        } catch (error) {
          appendMessagePair(actionText, `I could not book the appointment yet: ${error.message}`);
          setBookingState((prev) => ({
            ...prev,
            step: 'confirm_email'
          }));
        } finally {
          setLoading(false);
          setSubmissionState('success');
        }
        return;
      }

      case 'change_email': {
        const normalizedEmail = actionText.trim();
        if (!normalizedEmail.includes('@')) {
          setMessages((prev) => [
            ...prev,
            { role: 'user', text: normalizedEmail },
            { role: 'ai', text: 'That does not look like a valid email. Please try again.' }
          ]);
          return;
        }

        setLoading(true);
        setSubmissionState('booking');

        try {
          const nextBookingState = {
            ...bookingState,
            confirmedEmail: normalizedEmail
          };

          await bookCalendarAppointment(buildBookingPayload(nextBookingState, bookingState.leadPayload));
          appendMessagePair(normalizedEmail, 'Your consultation is booked. We will send the calendar invite to your email shortly.');
          sbStore.resetData();
          setBookingState(INITIAL_BOOKING_STATE);
          setPrompt('');
        } catch (error) {
          appendMessagePair(normalizedEmail, `I could not book the appointment yet: ${error.message}`);
          setBookingState((prev) => ({
            ...prev,
            confirmedEmail: normalizedEmail,
            step: 'change_email'
          }));
        } finally {
          setLoading(false);
          setSubmissionState('success');
        }
      }
    }
  }

  async function handleSend(explicitText) {
    const text = explicitText || prompt;

    if (!text.trim() || loading) {
      return;
    }

    if (bookingState.active) {
      await handleBookingAction(text);
      setPrompt('');
      return;
    }

    if (treeActive) {
      tree.handleAnswer(text);
      setPrompt('');
    }
  }

  function getBookingOptions() {
    switch (bookingState.step) {
      case 'offer_schedule':
        return SCHEDULE_OPTIONS;
      case 'day_picker':
        return bookingState.dayOptions;
      case 'time_of_day':
        return TIME_OF_DAY_OPTIONS;
      case 'time_picker':
        return buildVisibleSlotOptions(bookingState.filteredSlots, bookingState.currentIndex).labels;
      case 'confirm_email':
        return EMAIL_CONFIRM_OPTIONS;
      default:
        return [];
    }
  }

  const currentOptions = bookingState.active ? getBookingOptions() : tree.currentStep?.options || [];
  const isTextInputMode = bookingState.active
    ? bookingState.step === 'change_email'
    : tree.currentStep?.type === 'text';
  const isRangeMode = !bookingState.active && treeActive && tree.currentStep?.type === 'range';
  const statusText = submissionState === 'submitting'
    ? 'Sending lead to backend...'
    : submissionState === 'scheduling'
      ? 'Checking availability...'
      : submissionState === 'booking'
        ? 'Booking appointment...'
        : '';

  return (
    <section className={styles.widgetContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <img src={sunIcon} alt="Sun" className={styles.headerIcon} />
          <div>
            <h1>{companyName}</h1>
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

      {!loading && currentOptions.length > 0 && !isRangeMode && (treeActive || bookingState.active) && (
        <div className={styles.quickReplyContainer}>
          {currentOptions.map((option) => (
            <button key={option} className={styles.quickReplyButton} onClick={() => handleSend(option)}>
              {option}
            </button>
          ))}
        </div>
      )}

      <div className={styles.statusBar}>
        <span>{statusText}</span>
        {submissionState === 'success' && !bookingState.active && <strong>Stored</strong>}
        {submissionState === 'error' && <strong>Retry Needed</strong>}
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={isTextInputMode ? 'Type your answer here...' : 'Select an option above...'}
          disabled={(!treeActive && !bookingState.active) || (!isTextInputMode) || loading}
          onKeyDown={(event) => event.key === 'Enter' && handleSend()}
          className={styles.textInput}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !isTextInputMode || (!treeActive && !bookingState.active)}
          className={styles.sendButton}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </section>
  );
}
