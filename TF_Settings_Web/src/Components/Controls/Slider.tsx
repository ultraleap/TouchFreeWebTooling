import React, { PointerEvent, RefObject } from "react";

import '../../Styles/Controls/Sliders.css';

interface SliderProps {
    name: string,
    rangeMin: number,
    rangeMax: number,
    leftLabel: string,
    rightLabel: string,
    value: number,
    onChange: (newValue: number) => void,
    increment?: number,
}

export class Slider extends React.Component<SliderProps, {}> {
    public static defaultProps = {
        increment: 0.1
    };

    private dragging = false;

    private inputElement: RefObject<HTMLInputElement>;

    constructor(props: SliderProps) {
        super(props);

        this.inputElement = React.createRef();
    }

    private onChange() {
        // this function is here purely to pass to the input, preventing it becoming ReadOnly
    }

    private onUpOut() {
        this.dragging = false
    }

    private onDown(event: PointerEvent<HTMLInputElement>) {
        this.dragging = true;
        this.setValueByPos(event.nativeEvent.offsetX);
    }

    private onMove(event: PointerEvent<HTMLInputElement>) {
        if (this.dragging) {
            this.setValueByPos(event.nativeEvent.offsetX);
        }
    }

    private setValueByPos(xPos: number) {
        // call onChange with the horizontal position
        if (this.inputElement.current !== null) {
            let posInRange: number = xPos / this.inputElement.current.clientWidth;
            this.props.onChange(this.lerp(this.props.rangeMin, this.props.rangeMax, posInRange));
        }
    }

    private lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t
    }

    render() {
        return (
            <label className="backgroundLabel">
                <p className="sliderLabel">{this.props.name}</p>
                <div className="sliderContainer">
                    <input type="range"
                        step={this.props.increment}
                        min={this.props.rangeMin}
                        max={this.props.rangeMax}
                        className="slider"
                        onChange={this.onChange}
                        onPointerMove={this.onMove.bind(this)}
                        onPointerDown={this.onDown.bind(this)}
                        onPointerUp={this.onUpOut.bind(this)}
                        value={this.props.value}
                        id="myRange"
                        ref={this.inputElement} />
                    <div className="sliderLabelContainer">
                        <label className="leftSliderLabel">{this.props.leftLabel}</label>
                        <label className="rightSliderLabel">{this.props.rightLabel}</label>
                    </div>
                </div>
            </label>
        );
    }
}