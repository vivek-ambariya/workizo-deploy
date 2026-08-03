"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const containerStyle = {
    height: isMobile ? '50rem' : '70rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: isMobile ? '8px' : '40px',
    boxSizing: 'border-box',
    width: '100%',
  };

  const innerStyle = {
    paddingTop: isMobile ? '20px' : '80px',
    paddingBottom: isMobile ? '20px' : '80px',
    width: '100%',
    position: 'relative',
    perspective: "1000px",
  };

  return (
    <div style={containerStyle} ref={containerRef}>
      <div style={innerStyle}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale} isMobile={isMobile}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => {
  const headerStyle = {
    maxWidth: '1024px',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
    marginBottom: '24px',
  };

  return (
    <motion.div
      style={{
        translateY: translate,
        ...headerStyle,
      }}
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  isMobile,
}) => {
  const cardStyle = {
    rotateX: rotate,
    scale,
    boxShadow:
      "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
    maxWidth: '1024px',
    marginTop: '-24px',
    marginLeft: 'auto',
    marginRight: 'auto',
    height: isMobile ? '24rem' : '36rem',
    width: '100%',
    border: '4px solid #6C6C6C',
    padding: isMobile ? '8px' : '16px',
    backgroundColor: '#222222',
    borderRadius: '30px',
    boxSizing: 'border-box',
  };

  const innerWrapperStyle = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    borderRadius: '16px',
    backgroundColor: '#18181b',
    padding: isMobile ? '0' : '8px',
    boxSizing: 'border-box',
  };

  return (
    <motion.div style={cardStyle}>
      <div style={innerWrapperStyle}>
        {children}
      </div>
    </motion.div>
  );
};
