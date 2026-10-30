import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Linking, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import html from './html';

const ROOT_PATHS = ['/home', '/login', '/admin'];
const APP_ORIGIN = 'https://metcampus.met.edu';
const APP_BASE_URL = APP_ORIGIN + '/';
const SECURE_STORAGE_KEY = 'metCampus.supabase.auth.v1';

function isAppUrl(url) {
  return typeof url === 'string' && /^https:\/\/metcampus\.met\.edu(?::443)?(?:[/?#]|$)/i.test(url);
}

export default function App() {
  const webRef = useRef(null);
  const [nav, setNav] = useState({ path: '', sheet: false });
  const canGoBackRef = useRef(false);
  const onShouldStartLoadWithRequest = useCallback((request) => {
    const url = request && request.url;
    if (isAppUrl(url)) return true;
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      Linking.openURL(url).catch(() => {});
    }
    return false;
  }, []);
  const sourceHtml = useMemo(() => {
    const config = {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      demoMode: __DEV__
    };
    const serializedConfig = JSON.stringify(config).replace(/</g, '\\u003c');
    const bootstrap = '<script>window.__MET_CONFIG__=' + serializedConfig + ';</script>';
    return html.replace('</head>', bootstrap + '</head>');
  }, []);

  const canGoBack = !!nav.path && (nav.sheet || ROOT_PATHS.indexOf(nav.path) < 0);
  canGoBackRef.current = canGoBack;

  const onMessage = useCallback(async (event) => {
    const nativeEvent = event && event.nativeEvent;
    if (!nativeEvent || !isAppUrl(nativeEvent.url)) return;
    try {
      const data = JSON.parse(nativeEvent.data);
      if (data && data.type === 'state' && typeof data.path === 'string' &&
          (!data.path || data.path.charAt(0) === '/') && typeof data.sheet === 'boolean') {
        setNav({ path: data.path, sheet: data.sheet });
      } else if (data && data.type === 'secure-storage' &&
          typeof data.requestId === 'string' && /^secure-\d{1,10}$/.test(data.requestId) &&
          ['get', 'set', 'delete'].includes(data.action) &&
          (!Object.prototype.hasOwnProperty.call(data, 'key') || data.key === SECURE_STORAGE_KEY) &&
          (data.action !== 'set' || (typeof data.value === 'string' && data.value.length <= 65536))) {
        let value = null;
        let error = null;
        try {
          if (data.action === 'get') value = await SecureStore.getItemAsync(SECURE_STORAGE_KEY);
          else if (data.action === 'set') await SecureStore.setItemAsync(SECURE_STORAGE_KEY, data.value);
          else if (data.action === 'delete') await SecureStore.deleteItemAsync(SECURE_STORAGE_KEY);
        } catch (storageError) {
          error = storageError && storageError.message ? storageError.message : 'Secure storage failed.';
        }
        const reply = JSON.stringify({ requestId: data.requestId, value: value, error: error });
        webRef.current && webRef.current.injectJavaScript('window.__metNativeReply(' + reply + '); true;');
      }
    } catch (e) {
      // Other messages from the page are intentionally ignored.
    }
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current && webRef.current) {
        webRef.current.injectJavaScript('window.__metBack && window.__metBack(); true;');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" backgroundColor="#f4eef8" />
        <View style={styles.shell}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html: sourceHtml, baseUrl: APP_BASE_URL }}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            style={styles.webview}
            containerStyle={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            keyboardDisplayRequiresUserAction={false}
            setSupportMultipleWindows={false}
            textZoom={100}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4eef8' },
  shell: { flex: 1, backgroundColor: '#f4eef8' },
  webview: { flex: 1, backgroundColor: '#f4eef8' }
});
