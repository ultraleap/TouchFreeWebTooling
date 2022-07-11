/* eslint-disable @typescript-eslint/no-empty-function */
import 'Styles/Camera/Calibrate.css';

import React, { ReactElement, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConnectionManager } from 'TouchFree/Connection/ConnectionManager';
import { InputActionManager } from 'TouchFree/Plugins/InputActionManager';
import { InputType, InteractionType, TouchFreeInputAction } from 'TouchFree/TouchFreeToolingTypes';

import {
    CalibrationHandLostMessage,
    CalibrationCancelButton,
    CalibrationInstructions,
    CalibrationProgressCircle,
    CalibrationTutorialVideo,
} from './CalibrationComponents';

/**
 * CalibrationTop and CalibrationBottom screens use CalibrationBaseScreen to handle logic and just pass in their content
 */

interface CalibrationBaseScreenProps {
    isHandPresent: boolean;
    onCancel: () => void;
}

export const CalibrationTopScreen: React.FC<CalibrationBaseScreenProps> = ({
    isHandPresent,
    onCancel,
}): ReactElement => {
    const navigate = useNavigate();
    const content = (progressToClick: number): ReactElement => (
        <div className="contentContainer">
            <CalibrationInstructions progress={progressToClick} containerStyle={{ paddingTop: '100px' }} />
            <CalibrationProgressCircle progress={progressToClick} style={{ top: '294px' }} />
            {!isHandPresent ? <CalibrationHandLostMessage /> : <div style={{ height: '50px' }} />}
            <CalibrationTutorialVideo videoStyle={{ paddingTop: '50px' }} />
            <CalibrationCancelButton onCancel={onCancel} buttonStyle={{ marginTop: '575px' }} />
        </div>
    );

    const handleClick = () => {
        ConnectionManager.serviceConnection()?.QuickSetupRequest(
            true,
            () => {},
            () => {}
        );
        navigate('../bottom');
    };

    return CalibrationBaseScreen(handleClick, content);
};

export const CalibrationBottomScreen: React.FC<CalibrationBaseScreenProps> = ({
    isHandPresent,
    onCancel,
}): ReactElement => {
    const navigate = useNavigate();
    const content = (progressToClick: number): ReactElement => (
        <div className="contentContainer">
            <CalibrationTutorialVideo videoStyle={{ paddingTop: '600px' }} />
            <CalibrationInstructions progress={progressToClick} containerStyle={{ paddingTop: '50px' }} />
            <CalibrationProgressCircle progress={progressToClick} style={{ top: '1446px' }} />
            {!isHandPresent ? <CalibrationHandLostMessage /> : <div style={{ height: '50px' }} />}
            <CalibrationCancelButton onCancel={onCancel} buttonStyle={{ marginTop: '75px' }} />
        </div>
    );

    const handleClick = () => {
        ConnectionManager.serviceConnection()?.QuickSetupRequest(
            false,
            () => {},
            () => {}
        );
        navigate('../complete');
    };

    return CalibrationBaseScreen(handleClick, content);
};

const CalibrationBaseScreen = (
    handleClick: () => void,
    content: (progressToClick: number) => ReactElement
): ReactElement => {
    const [progressToClick, setProgressToClick] = React.useState<number>(0);
    const isNewClick = React.useRef<boolean>(false);

    useEffect(() => {
        InputActionManager._instance.addEventListener('TransmitInputAction', handleTFInput as EventListener);

        return () => {
            InputActionManager._instance.removeEventListener('TransmitInputAction', handleTFInput as EventListener);
        };
    }, []);

    const handleTFInput = (evt: CustomEvent<TouchFreeInputAction>): void => {
        if (evt.detail.InteractionType === InteractionType.HOVER) {
            if (!isNewClick.current) {
                isNewClick.current = evt.detail.ProgressToClick === 0;
                return;
            }

            if (evt.detail.InputType === InputType.MOVE || evt.detail.InputType === InputType.DOWN) {
                setProgressToClick(evt.detail.ProgressToClick);
                if (evt.detail.ProgressToClick >= 1) {
                    handleClick();
                }
            }
        }
    };

    return content(progressToClick);
};
