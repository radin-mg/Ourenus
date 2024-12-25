import { Grid } from "@mui/material";
import "./SnowEffect.scss";

const SnowEffect = () => {
  const getSnowflakeCount = () => {
    const width = window.innerWidth;
    if (width <= 576) return 50;
    if (width <= 768) return 100;
    if (width <= 992) return 150;
    return 200;
  };

  const snowflakes = Array.from({ length: getSnowflakeCount() }, (_, i) => (
    <Grid key={i} className="snow"></Grid>
  ));

  return <Grid className="snow-container">{snowflakes}</Grid>;
};

export default SnowEffect;
