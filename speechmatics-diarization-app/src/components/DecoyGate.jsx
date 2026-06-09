import { useState } from 'react';
import './DecoyGate.css';

const UNLOCK_KEY = 'app_unlocked';
const PASSCODE = '9545';

function getInitialUnlocked() {
    try {
        return sessionStorage.getItem(UNLOCK_KEY) === 'true';
    } catch {
        return false;
    }
}

const DecoyGate = ({ children }) => {
    const [isUnlocked, setIsUnlocked] = useState(getInitialUnlocked);
    const [, setTitleClicks] = useState(0);
    const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');

    const openPasscodeAfterClicks = () => {
        setTitleClicks((current) => {
            const next = current + 1;
            if (next >= 5) {
                setIsPasscodeOpen(true);
                return 0;
            }
            return next;
        });
    };

    const unlock = (event) => {
        event.preventDefault();

        if (passcode === PASSCODE) {
            sessionStorage.setItem(UNLOCK_KEY, 'true');
            setIsUnlocked(true);
            setPasscode('');
            setError('');
            setIsPasscodeOpen(false);
            return;
        }

        setPasscode('');
        setError('Incorrect passcode.');
    };

    const lock = () => {
        sessionStorage.removeItem(UNLOCK_KEY);
        setIsUnlocked(false);
        setTitleClicks(0);
        setIsPasscodeOpen(false);
        setPasscode('');
        setError('');
    };

    if (isUnlocked) {
        return (
            <>
                <button className="decoy-lock-button" type="button" onClick={lock}>
                    Lock
                </button>
                {children}
            </>
        );
    }

    return (
        <main className="decoy-page">
            <section className="decoy-panel" aria-label="Pomodoro timer">
                <button className="decoy-title-button" type="button" onClick={openPasscodeAfterClicks}>
                    Pomodoro Timer
                </button>
                <div className="decoy-timer" aria-label="25 minutes">
                    25:00
                </div>
                <div className="decoy-actions">
                    <button type="button">Start</button>
                    <button type="button">Reset</button>
                </div>
            </section>

            {isPasscodeOpen && (
                <div className="decoy-modal-overlay" role="presentation">
                    <form className="decoy-modal" onSubmit={unlock}>
                        <label htmlFor="decoy-passcode">Passcode</label>
                        <input
                            id="decoy-passcode"
                            autoFocus
                            inputMode="numeric"
                            value={passcode}
                            onChange={(event) => setPasscode(event.target.value)}
                        />
                        {error && <div className="decoy-error">{error}</div>}
                        <div className="decoy-modal-actions">
                            <button type="submit">Unlock</button>
                            <button type="button" onClick={() => setIsPasscodeOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default DecoyGate;
