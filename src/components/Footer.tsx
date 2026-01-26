import React from 'react';

export const Footer: React.FC = () => {
    return (
        <>
            <div className="text-center info-box mt-8">
                <h3 className="mb-6">Follow me</h3>
                <div className="flex flex-wrap justify-center gap-4">
                    <SocialLink href="https://www.instagram.com/sasha.alieksieiev/" label="Instagram" />
                    <SocialLink href="https://projectlira.bandcamp.com/" label="Bandcamp" />
                    <SocialLink href="https://open.spotify.com/artist/4RDL510srayFbdb2QUcwDg?si=N_LHLfdkQbK8VdlfdSwAwA" label="Spotify" />
                    <SocialLink href="https://www.linkedin.com/in/oleksandralieksieiev/" label="LinkedIn" />
                </div>
            </div>

            <footer className="text-center info-box mt-8">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-sm text-neural-n80">
                            Neural DSP®, Neural Capture®, Nano Cortex®, and Quad Cortex® are registered trademarks of Neural DSP Technologies Oy.
                        </p>
                        <p className="text-sm mt-4 text-neural-n70">
                            Unofficial MIDI controller. Not affiliated with Neural DSP Technologies.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

const SocialLink = ({ href, label }: { href: string; label: string }) => (
    <a
        href={href}
        target="_blank"
        className="inline-block px-8 py-4 text-lg btn-connect"
        rel="noreferrer"
    >
        {label}
    </a>
);
