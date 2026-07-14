import LeadDashboard from './components/LeadDashboard.jsx';
import SolarBuddyWidget from './components/SolarBuddyWidget.jsx';
import './index.css';

function App() {
  return (
    <main className="appShell">
      <section className="appIntro">
        <p className="eyebrow">Solar Buddy Demo</p>
        <h1>Lead capture, routing, and dashboard in one flow.</h1>
        <p className="introCopy">
          This demo walks a visitor through qualification, stores the lead in the
          backend, and reflects the result immediately in a lightweight dashboard.
        </p>
      </section>

      <section className="demoGrid">
        <SolarBuddyWidget industry="Solar Power" companyName="Solar Buddy" />
        <LeadDashboard />
      </section>
    </main>
  );
}

export default App;
