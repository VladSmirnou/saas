import {
  clearExpiredAbsoluteTimeSessions,
  clearExpiredIdleTimeSessions,
} from './session-utils';

clearExpiredIdleTimeSessions();
clearExpiredAbsoluteTimeSessions();
