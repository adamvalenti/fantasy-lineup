import React, { useState, useEffect } from "react";
import { Slider } from "@mui/material";
import { LockOutlined, LockOpenOutlined } from "@material-ui/icons";
import "./builderParameters.css";

export default function BuilderParameters() {
  const [positionRequirements, setPositionRequirements] = useState([]);
  const [positionValues, setPositionValues] = useState([]);
  const [scoringParams, setScoringParams] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  const startingRequirements = { G: 4, F: 4, C: 1, Any: 1 };
  const startingParams = {
    PTS: 1,
    AST: 1.5,
    REB: 1.5,
    STL: 3,
    BLK: 3,
    TOV: -1,
  };

  useEffect(() => {
    setPositionRequirements(startingRequirements);
  }, []);

  useEffect(() => {
    setScoringParams(startingParams);
  }, []);

  useEffect(() => {
    var newPositionValues = Object.values(positionRequirements).slice(0, 3);

    var sum = 0;
    for (let i = 0; i < newPositionValues.length; i++) {
      newPositionValues[i] += sum;
      sum = newPositionValues[i];
    }
    setPositionValues(newPositionValues);
  }, [positionRequirements]);

  function handlePositionChange(e) {
    var newSliderValues = e.target.value;
    var newPositionRequirements = { ...positionRequirements };

    newPositionRequirements["G"] = newSliderValues[0];
    newPositionRequirements["F"] = newSliderValues[1] - newSliderValues[0];
    newPositionRequirements["C"] = newSliderValues[2] - newSliderValues[1];
    newPositionRequirements["Any"] = 10 - newSliderValues[2];

    setPositionRequirements(newPositionRequirements);
  }

  function handleParamChange(event, param) {
    var newScoringParams = { ...scoringParams };
    newScoringParams[param] = event.target.value;
    setScoringParams(newScoringParams);
  }

  function handleContentLock() {
    setIsLocked(!isLocked);
  }

  return (
    <div className="builderParametersContent">
      <div
        className="builderParametersSection"
        style={{
          opacity: isLocked ? 0.5 : 1,
          pointerEvents: isLocked ? "none" : "auto",
        }}
      >
        <div className="builderParametersTitle">Roster Requirements</div>
        <div className="positionSliderContainer">
          <Slider
            sx={{
              color: "#a5b4fc",
              "& .MuiSlider-thumb": {
                borderRadius: "1px",
                width: "8px",
              },
              "& .MuiSlider-thumb:hover": {
                boxShadow: "0 0 0 8px rgba(126, 135, 191, 0.3)",
              },
              "& .Mui-focusVisible": {
                webkitBoxShadow: "none !important",
                boxShadow: "0 0 0 8px rgba(126, 135, 191, 0.3) !important",
              },
              "& .MuiSlider-track": {
                color: "#a5b4fc",
                opacity: 1,
              },
              "& .MuiSlider-rail": {
                bacground: "linear-gradient(90deg, a5b4fc 50%, green 7e87bf%)",
                opacity: 1,
                height: "6px",
              },
            }}
            className="positionSlider"
            step={1}
            min={0}
            max={10}
            value={positionValues}
            onChange={(e) => handlePositionChange(e)}
          />
        </div>
        <div className="positionRequirements">
          {Object.keys(positionRequirements).map((position, i) => {
            return (
              <div key={i} className="positionRequirement">
                {`${position}: ${positionRequirements[position]}`}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="builderParametersSection"
        style={{
          opacity: isLocked ? 0.5 : 1,
          pointerEvents: isLocked ? "none" : "auto",
        }}
      >
        <div className="builderParametersTitle">Scoring Parameters</div>
        <div className="builderParametersItems">
          {Object.keys(scoringParams).map((param, i) => {
            return (
              <div key={i} className="builderParametersItem">
                <div className="itemText">
                  {`${param} - ${
                    param === "TOV"
                      ? "(" + scoringParams[param].toFixed(1) + ")"
                      : scoringParams[param].toFixed(1)
                  }`}
                </div>
                <div className="slider">
                  <Slider
                    sx={{
                      color: "#a5b4fc",
                      "& .MuiSlider-thumb": {
                        borderRadius: "1px",
                        width: "8px",
                      },
                      "& .Mui-focusVisible": {
                        webkitBoxShadow: "none !important",
                        boxShadow:
                          "0 0 0 8px rgba(126, 135, 191, 0.3) !important",
                      },
                      "& .MuiSlider-thumb:hover": {
                        boxShadow: "0 0 0 8px rgba(126, 135, 191, 0.3)",
                      },
                      "& .MuiSlider-track": {
                        color: "#a5b4fc",
                        opacity: 1,
                      },
                      "& .MuiSlider-rail": {
                        color: "#a5b4fc",
                      },
                      "& .MuiSlider-valueLabel": {
                        backgroundColor: "#2a2b30",
                      },
                    }}
                    className="paramSlider"
                    valueLabelDisplay="auto"
                    step={0.5}
                    min={param === "TOV" ? -5 : 1}
                    max={param === "TOV" ? -1 : 5}
                    value={scoringParams[param]}
                    onChange={(e) => handleParamChange(e, param)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="builderParametersTopright" onClick={handleContentLock}>
        <div className="lockParametersButton">
          {isLocked ? <LockOutlined /> : <LockOpenOutlined />}
        </div>
      </div>
    </div>
  );
}
