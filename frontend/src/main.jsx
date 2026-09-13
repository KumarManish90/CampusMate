import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./responsive.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("CampusMate render recovery", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="cm-crash-recovery"><div><h1>We couldn't open this screen.</h1><p>Your account is safe. Retry the screen without refreshing the whole app.</p><button onClick={() => this.setState({ error: null })}>Try again</button><button onClick={() => window.location.assign("/")}>Go to home</button></div></main>;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </React.StrictMode>
);
