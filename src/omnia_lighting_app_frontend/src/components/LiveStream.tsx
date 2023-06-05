import { Box } from "@chakra-ui/react";
import ReactPlayer from "react-player";

const LiveStream = () => {
    return (
        <Box>
            <ReactPlayer
                url={process.env['VITE_LIVE_STREAM_URL']}
                playing
                controls
                muted
                playsinline
            />
        </Box>
    );
};

export default LiveStream;
