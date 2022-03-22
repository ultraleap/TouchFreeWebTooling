import React, { ChangeEventHandler } from "react";

import '../../Styles/Controls/Sliders.css';

interface SliderProps {
    name: string,
    rangeMin: number,
    rangeMax: number,
    leftLabel: string,
    rightLabel: string,
    value: number,
    onChange: ChangeEventHandler<HTMLInputElement>
}

export class Slider extends React.Component<SliderProps, {}> {
    render() {
        return(
            <label className="backgroundLabel">
                <p className="sliderLabel">{this.props.name}</p>
                <div className="sliderContainer">
                    <input type="range"
                        step={0.05}
                        min={this.props.rangeMin}
                        max={this.props.rangeMax}
                        className="slider"
                        onChange={this.props.onChange.bind(this)}
                        value={this.props.value}
                        id="myRange"/>
                    <div className="sliderLabelContainer">
                        <label className="leftSliderLabel">{this.props.leftLabel}</label>
                        <label className="rightSliderLabel">{this.props.rightLabel}</label>
                    </div>
                </div>
            </label>
        );
    }
}