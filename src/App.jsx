import React, { useEffect, useState } from 'react';
import { Client } from 'paho-mqtt';

const App = () => {
  const [messages, setMessages] = useState([]); // To store received messages
  const [viewMode, setViewMode] = useState('json'); // 'json' or 'table' view mode

  useEffect(() => {
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt'; // WebSocket-enabled MQTT broker URL
    const topic = 'paho/test/topic';
    const clientId = `mqttjs_${Math.random().toString(16).substr(2, 8)}`;

    // Create MQTT client
    const client = new Client(brokerUrl, clientId);

    client.onMessageArrived = (message) => {
      console.log('Message received:', message.payloadString);
      try {
        const jsonMessage = JSON.parse(message.payloadString);
        setMessages((prevMessages) => [jsonMessage, ...prevMessages]); // Add new message at the top
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    client.onConnectionLost = (responseObject) => {
      console.error('Connection lost:', responseObject.errorMessage);
    };

    client.connect({
      onSuccess: () => {
        console.log('Connected to MQTT broker');
        client.subscribe(topic, {
          onSuccess: () => {
            console.log(`Subscribed to topic: ${topic}`);
          },
          onFailure: (err) => {
            console.error('Subscription failed:', err);
          },
        });
      },
      onFailure: (err) => {
        console.error('Connection failed:', err);
      },
      useSSL: true, // Enable SSL for secure connection
    });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  // Function to generate and download the JSON file
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mqtt_messages.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to generate and download the CSV file
  const downloadCSV = () => {
    const headers = Object.keys(messages[0] || {}).join(',');
    const rows = messages.map((msg) => Object.values(msg).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mqtt_messages.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h1>MQTT Subscriber</h1>
      <div style={styles.buttonContainer}>
        <button onClick={() => setViewMode('json')} style={styles.button}>JSON View</button>
        <button onClick={() => setViewMode('table')} style={styles.button}>Table View</button>
        <button onClick={downloadJSON} style={styles.button}>Download JSON</button>
        <button onClick={downloadCSV} style={styles.button}>Download CSV</button>
      </div>
      <div style={styles.scrollBox}>
        {viewMode === 'json' ? (
          messages.length === 0 ? (
            <p>No messages received</p>
          ) : (
            messages.map((msg, index) => (
              <pre key={index}>{JSON.stringify(msg, null, 2)}</pre>
            ))
          )
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {messages.length > 0 &&
                  Object.keys(messages[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, index) => (
                <tr key={index}>
                  {Object.values(msg).map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    color: 'black',
    padding: '0',
    margin: '0',
  },
  buttonContainer: {
    marginBottom: '20px',
  },
  button: {
    margin: '10px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  scrollBox: {
    width: '80%',
    maxHeight: '400px',
    overflowY: 'auto',
    marginTop: '20px',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
  },
};

export default App;
