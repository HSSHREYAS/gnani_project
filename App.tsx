/**
 * MatsyaMitra — Coastal Decision Support System for Fishermen
 * Root Application Component
 */

import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/i18n';

// Hide the yellow developer-warning banner so it never covers the tab bar
// (it would show up in demo recordings). Crashes still show a red screen.
LogBox.ignoreAllLogs(true);

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F4F7FB"
          translucent={false}
        />
        <AppNavigator />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
