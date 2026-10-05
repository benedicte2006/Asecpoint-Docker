import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { CheckinNotification } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private connectionSubject = new Subject<boolean>();

  constructor() {
    this.initStompClient();
  }

  private initStompClient(): void {
    // Détection de l'URL WS relative
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // console.log('[STOMP]', str);
      },
      onConnect: () => {
        console.log('[STOMP] Connecté au serveur WebSocket ASECNA');
        this.isConnected = true;
        this.connectionSubject.next(true);
      },
      onDisconnect: () => {
        console.log('[STOMP] Déconnecté du serveur WebSocket');
        this.isConnected = false;
        this.connectionSubject.next(false);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Erreur STOMP broker:', frame.headers['message'], frame.body);
      }
    });

    this.client.activate();
  }

  subscribeToSession(sessionId: string): Observable<CheckinNotification> {
    return new Observable<CheckinNotification>(subscriber => {
      let sub: StompSubscription | null = null;

      const performSubscribe = () => {
        if (this.client && this.client.connected) {
          const destination = `/topic/borne-session/${sessionId}`;
          console.log(`[STOMP] Abonnement à ${destination}`);
          sub = this.client.subscribe(destination, (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body) as CheckinNotification;
              subscriber.next(payload);
            } catch (err) {
              console.error('[STOMP] Erreur parsing message:', err);
            }
          });
        }
      };

      let subConn: any = null;
      if (this.client && this.client.connected) {
        performSubscribe();
      } else {
        subConn = this.connectionSubject.subscribe(connected => {
          if (connected) {
            performSubscribe();
            if (subConn) subConn.unsubscribe();
          }
        });
      }

      return () => {
        if (sub) {
          console.log(`[STOMP] Désabonnement de session ${sessionId}`);
          sub.unsubscribe();
        }
        if (subConn) subConn.unsubscribe();
      };
    });
  }

  subscribeToGlobalFeed(): Observable<CheckinNotification> {
    return new Observable<CheckinNotification>(subscriber => {
      let sub: StompSubscription | null = null;

      const performSubscribe = () => {
        if (this.client && this.client.connected) {
          sub = this.client.subscribe('/topic/pointages', (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body) as CheckinNotification;
              subscriber.next(payload);
            } catch (err) {
              console.error('[STOMP] Erreur parsing global feed:', err);
            }
          });
        }
      };

      let subConn: any = null;
      if (this.client && this.client.connected) {
        performSubscribe();
      } else {
        subConn = this.connectionSubject.subscribe(connected => {
          if (connected) {
            performSubscribe();
            if (subConn) subConn.unsubscribe();
          }
        });
      }

      return () => {
        if (sub) sub.unsubscribe();
        if (subConn) subConn.unsubscribe();
      };
    });
  }
}
