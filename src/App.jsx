import LeadDashboard from './components/LeadDashboard.jsx';
import SolarBuddyWidget from './components/SolarBuddyWidget.jsx';
import './index.css';

function App() {
  return (
    <main className="appShell">
      <h1 className="pageTitle">Solar Buddy</h1>
      <section className="demoGrid">
        <SolarBuddyWidget industry="Solar Power" companyName="Solar Buddy" />
        <LeadDashboard />
      </section>
    </main>
  );
}

export default App;
