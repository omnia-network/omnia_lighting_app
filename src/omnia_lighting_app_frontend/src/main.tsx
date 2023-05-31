import React from 'react'
import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import theme from './theme.ts';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { CommandsProvider } from './contexts/CommandsContext.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <CommandsProvider>
          <App />
        </CommandsProvider>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
