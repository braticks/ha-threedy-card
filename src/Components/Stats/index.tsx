import React, { useContext } from 'react';
import ThreedyContext from '../../Contexts/ThreedyContext';

import styles from './styles';
import {percentComplete, renderStats} from "./utils";

type StatsProps = {
    showPercent?: boolean
};

const Stats: React.FC<StatsProps> = ({ showPercent = true }) => {

    const {
        hass,
        config,
    } = useContext(ThreedyContext);

    const round = config.round === undefined ? true : config.round;
    const percent = percentComplete(hass, config);

    return (
        <div style={{ ...styles.Stats }}>
            {
                showPercent ? (
                    <div style={{ ...styles.Percent, marginBottom: config.compact ? 6 : 20 }}>
                        <p style={{ ...styles.PercentText, fontSize: config.compact ? 28 : 42, height: config.compact ? '30px' : '44px', lineHeight: config.compact ? '30px' : '44px' }}>{round ? Math.round(percent) : percent}%</p>
                    </div>
                ) : (null)
            }
            <div style={{ ...styles.Monitored }}>
                {
                    config.monitored ? renderStats(hass, config) : null
                }
            </div>
        </div>
    )


}

export default Stats;
