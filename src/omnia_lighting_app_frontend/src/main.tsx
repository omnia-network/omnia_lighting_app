import React from 'react'
import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import theme from './theme.ts';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { CommandsProvider } from './contexts/CommandsContext.tsx';
import { DevicesProvider } from './contexts/DevicesContext.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <DevicesProvider>
          <CommandsProvider>
            <App />
          </CommandsProvider>
        </DevicesProvider>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
